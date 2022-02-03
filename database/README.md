# Import Process

1. Create a MySQL database from the dump files provided by our client.
2. Run the import.js script to generate the sqlite database.

## Example

```bash
cat sources/*.sql | mysql --host=$HOST --port=$PORT --user=$USER --password=$PASSWORD --database=$DATABASE
node import.js --output cprosite.db --host $HOST --port $PORT --user $USER --password $PASSWORD --database $DATABASE
```
