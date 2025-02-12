from flask import Flask, render_template, request, redirect, url_for, flash, session 
from flask_bcrypt import Bcrypt
import pymysql

app = Flask(__name__)
app.secret_key = "supersecretkey"
bcrypt = Bcrypt(app)

def get_db_connection():
    return pymysql.connect(
        host="localhost",
        user="root",  
        password="123456789",  
        database="Pet",
        port=3306,  
        cursorclass=pymysql.cursors.DictCursor  
    )

# Ruta para la raíz de la aplicación
@app.route('/')
def home():
    return redirect(url_for('register_form'))  # Redirige a la página de registro

# Ruta para mostrar el formulario de registro
@app.route('/register', methods=['GET'])
def register_form():
    return render_template('register.html')  # Asegúrate de que este archivo exista en la carpeta templates

@app.route('/register', methods=['POST'])
def register():
    email = request.form['email']
    full_name = request.form['full_name']
    phone = request.form['phone']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    # Validar que las contraseñas coincidan
    if password != confirm_password:
        flash("Las contraseñas no coinciden", "danger")
        return redirect(url_for('register_form'))

    # Encriptar la contraseña
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Conectar a la base de datos
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            "INSERT INTO users (email, password_hash, full_name, phone) VALUES (%s, %s, %s, %s)",
            (email, hashed_password, full_name, phone)
        )
        conn.commit()
        flash("Registro exitoso. Ahora puedes iniciar sesión.", "success")
        return redirect(url_for('login_form'))  # Redirige a la página de inicio de sesión después de un registro exitoso
    
    except pymysql.IntegrityError:
        conn.rollback()
        flash("Error: El email ya está registrado.", "danger")

    except Exception as e:
        flash(f"Error: {e}", "danger")
    
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('register_form'))


@app.route('/login', methods=['GET'])
def login_form():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    email = request.form['email']
    password = request.form['password']

    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Buscar el usuario en la base de datos
        cursor.execute("SELECT id, password_hash FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if user and bcrypt.check_password_hash(user["password_hash"], password):  
            session['user_id'] = user["id"]
            flash("Login exitoso", "success")
            return redirect(url_for('app_form'))  
    
        else:
            flash("Correo o contraseña incorrectos", "danger")

    except Exception as e:
        flash("Error: " + str(e), "danger")
    
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('login_form'))


@app.route('/app', methods=['GET'])
def app_form():
    return render_template('app.html')

if __name__ == '__main__':
    app.run(debug=True)