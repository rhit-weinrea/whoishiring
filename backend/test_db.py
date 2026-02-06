import psycopg2

try:
    conn = psycopg2.connect(
        host="hn-scraper-db.c1aoskmig9y4.us-east-2.rds.amazonaws.com",
        port=5432,
        database="postgres",
        user="abbyweinreb",
        password="moby-dick"
    )
    print("✅ Database connection successful!")
    conn.close()
except Exception as e:
    print(f"❌ Connection failed: {e}")