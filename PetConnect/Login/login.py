from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_bcrypt import Bcrypt
from config import get_db_connection  

app = Flask(__name__)
app.secret_key = "supersecretkey"  
bcrypt = Bcrypt(app)

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

        if user and bcrypt.check_password_hash(user[1], password):  
            session['user_id'] = user[0]
            flash("Login exitoso", "success")
            return redirect(url_for('dashboard'))  
        else:
            flash("Correo o contraseña incorrectos", "danger")

    except Exception as e:
        flash("Error: " + str(e), "danger")
    
    finally:
        cursor.close()
        conn.close()

    return redirect(url_for('login_form'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash("Por favor, inicia sesión primero.", "warning")
        return redirect(url_for('login_form'))
    return "Bienvenido al Dashboard"

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    flash("Has cerrado sesión.", "info")
    return redirect("login.html")

@app.route('/app', methods=['GET'])
def app_form():
    return render_template('app.html')

if __name__ == '__main__':
    app.run(debug=True)
