import psycopg2

conn = psycopg2.connect(
    host="db.nbsexaudndekoscjepiy.supabase.co",
    database="postgres",
    user="postgres",
    password="Bin0374352966",
    port="5432"
)

print("Connect success")