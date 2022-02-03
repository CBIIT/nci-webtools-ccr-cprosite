# Import Process

1. Run `npm install` to install dependencies.
2. Create a MySQL database from the dump files provided by our client.
3. Run the import.js script to generate the sqlite database.

## Example

```bash
npm install
aws s3 sync s3://$CPROSITE_BUCKET/sources data/sources
cat data/sources/*.sql | mysql --host=$HOST --port=$PORT --user=$USER --password=$PASSWORD --database=$DATABASE
node import.js --output cprosite.db --host $HOST --port $PORT --user $USER --password $PASSWORD --database $DATABASE
```
