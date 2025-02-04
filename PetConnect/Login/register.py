from flask import Flask, render_template, request, redirect, url_for, flash
from flask_bcrypt import Bcrypt
from config import get_db_connection

app = Flask(__name__)
app.secret_key = "supersecretkey"  # Necesario para manejar mensajes flash
bcrypt = Bcrypt(app)

# Ruta para mostrar el formulario de registro
@app.route('/register', methods=['GET'])
def register_form():
    return render_template('register.html')

# Ruta para procesar el formulario de registro
@app.route('/register', methods=['POST'])
def register():
    email = request.form['email']
    full_name = request.form['full_name']
    password = request.form['password']

    # Generar el hash de la contraseña
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Guardar en la base de datos
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name) VALUES (%s, %s, %s)",
            (email, hashed_password, full_name)
        )
        conn.commit()
        flash("Registro exitoso. Ahora puedes iniciar sesión.", "success")
    except Exception as e:
        flash("Error: " + str(e), "danger")
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('register_form'))

if __name__ == '__main__':
    print(app.url_map)
    app.run(debug=True)
