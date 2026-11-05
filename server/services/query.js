module.exports = { query };

function query(database, params) {
  // enable read-only mode
  database.pragma("query_only = ON");
  const ifDefined = (value, statement, defaultValue = "") =>
    value ? statement : defaultValue;
  let { table, offset, limit, order, orderBy, columns, distinct, count, raw } =
    params;

  limit = limit || 100000;
  offset = offset || 0;

  // validate provided table, and use the canonical name stored in the
  // database schema (never the user-provided string) in query strings
  const canonicalTable = database
    .prepare(
      `SELECT tbl_name FROM sqlite_master
        WHERE tbl_name = :table`,
    )
    .pluck()
    .get({ table });

  if (!table || !canonicalTable)
    throw new Error("Please provide a valid table");

  // retrieve column metadata
  const columnNames = database
    .prepare(`pragma table_info('${canonicalTable}')`)
    .all()
    .map((c) => c.name);

  const filterTypes = ["like", "between", "in", "eq", "gt", "gte", "lt", "lte"];

  // determine filters (eg: _column:eq=value), using the canonical column and
  // filter type names (never the user-provided strings) in query strings
  const filters = Object.entries(params)
    .filter(([key]) => key.startsWith("_"))
    .map(([_key, value]) => {
      // {'column:filter_type': value}
      const [key, type] = _key.split(":");
      return [
        columnNames.find((name) => name === key.replace(/^_/, "")),
        value,
        filterTypes.find((name) => name === type) || "eq",
      ];
    })
    .filter(([key]) => key !== undefined);

  // map filters to an object containing {placeholder: value} props
  let queryParams = {};
  filters.forEach(([key, value, type]) => {
    if (type === "like") {
      queryParams[`${key}_${type}`] = `%${value}%`;
    } else if (["in", "between"].includes(type)) {
      value
        .split(",")
        .forEach((val, i) => (queryParams[`${key}_${type}_${i}`] = val));
    } else {
      queryParams[`${key}_${type}`] = value;
    }
  });

  // columns, table, order, and orderBy must be sanitized/validated
  // since they can not be bound parameters
  columns = !columns
    ? columnNames
    : columns
        .split(",")
        .map((s) => columnNames.find((name) => name === s.trim()))
        .filter((column) => column !== undefined);

  if (order && !/^(asc|desc)$/i.test(order)) order = "asc";

  // ORDER BY direction can not be a bound parameter; use our own literals
  const orderDirection = /^desc$/i.test(order) ? "DESC" : "ASC";

  orderBy = orderBy
    ? columnNames.find((name) => name === orderBy) || columns[0]
    : undefined;

  let conditions = ifDefined(
    filters.length,
    `WHERE ${filters
      .map(
        ([key, value, type]) => `
                ${key} 
                ${
                  {
                    // operator
                    like: "LIKE",
                    between: "BETWEEN",
                    in: "IN",
                    eq: "=",
                    gt: ">",
                    gte: ">=",
                    lt: "<",
                    lte: "<=",
                  }[type] || "="
                } 
                ${
                  {
                    // placeholder
                    in: `(${value
                      .split(",")
                      .map((_, i) => `:${key}_${type}_${i}`)})`,
                    between: value
                      .split(",")
                      .map((_, i) => `:${key}_${type}_${i}`)
                      .join(" AND "),
                  }[type] || `:${key}_${type}`
                }
            `,
      )
      .join(" AND ")}`,
  );

  const queryColumns = columns.map((c) => `"${c}"`).join(",");

  const statement = database.prepare(
    `SELECT ${ifDefined(distinct, "DISTINCT")} ${queryColumns}
        FROM "${canonicalTable}" ${conditions}
        ${ifDefined(order && orderBy, `ORDER BY "${orderBy}" ${orderDirection}`)}
        ${ifDefined(limit, `LIMIT :limit`)}
        ${ifDefined(offset, `OFFSET :offset`)}`,
  );

  let result = {
    orderBy,
    order,
    offset,
    limit,
    filters: filters
      .map(([key, value, type]) => [`_${key}:${type}`, value])
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    columns: statement.columns().map((c) => c.name),
    records: statement.raw(Boolean(raw)).all({ offset, limit, ...queryParams }),
  };

  if (count) {
    result.count = database
      .prepare(
        `SELECT COUNT(*) FROM (
                SELECT ${ifDefined(distinct, "DISTINCT")} ${queryColumns}
                FROM "${canonicalTable}" ${conditions}
            )`,
      )
      .pluck()
      .get(queryParams);
  }

  return result;
}
