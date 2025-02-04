import pymysql

def get_db_connection():
    return pymysql.connect(
        host="localhost",
        port=3306,
        user="root",
        password="123456789",
        database="Pet",
        charset="utf8mb4",
        cursorclass=pymysql.cursors.DictCursor
    )
