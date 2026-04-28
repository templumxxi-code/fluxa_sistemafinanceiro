import sqlite3
import json

conn = sqlite3.connect('fluxa.db')
cur = conn.cursor()

# Check existing centers
cur.execute('SELECT id, name, banco, description, orcamento FROM financial_centers')
rows = cur.fetchall()
print('Centros financeiros existentes:')
for row in rows:
    print(row)

conn.close()