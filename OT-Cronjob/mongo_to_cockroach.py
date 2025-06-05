import pymongo
import psycopg2

# MongoDB Atlas connection
mongo_client = pymongo.MongoClient("mongodb+srv://radhar1525:ryUHLBLDVhBQaADi@cluster0.stcjvpl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")
mongo_db = mongo_client["try"]
mongo_collection = mongo_db["jobs"]

# CockroachDB connection
pg_conn = psycopg2.connect(
    dbname="defaultdb",
    user="dass",
    password="AmU0Bb5ULBiOJqxhTCJPYA",
    host="team-23-10443.j77.aws-ap-south-1.cockroachlabs.cloud",
    port="26257",
    sslmode="verify-full",
    sslrootcert="root.crt"
)
pg_cursor = pg_conn.cursor()

# Transfer only new data
for doc in mongo_collection.find():
    title = doc.get("title")
    company = doc.get("company")
    posted_date = doc.get("posted_date")

    # Check if job already exists
    pg_cursor.execute("""
        SELECT 1 FROM jobs
        WHERE title = %s AND company = %s AND posted_date = %s;
    """, (title, company, posted_date))

    if pg_cursor.fetchone() is None:
        # Insert if not found
        pg_cursor.execute("""
            INSERT INTO jobs (
                title, company, location, description, skills,
                salary, type, posted_date, deadline, status, email
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
        """, (
            title,
            company,
            doc.get("location"),
            doc.get("description"),
            doc.get("skills", []),
            doc.get("salary"),
            doc.get("type"),
            posted_date,
            doc.get("deadline"),
            doc.get("status", "active"),
            doc.get("email")
        ))

pg_conn.commit()

# Close connections
pg_cursor.close()
pg_conn.close()
mongo_client.close()

print("New job data successfully transferred to CockroachDB!")
