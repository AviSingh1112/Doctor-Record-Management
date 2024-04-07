# Doctor-Record-Management
Doctor Record Management using html nodejs css and mysql
This is very basic Doctor profile and appointment management system created using html nodejs css and mysql workbench.
How to run:
1. Place all of the css files in a folder named "assets", place the assets folder along with the rest of the codes in ur project folder
2. Run the following mysql codes in the workbench to setup the database:(use a newline after each semicolon and comment)
create database nodejs;
use nodejs;
create table if not exists 	loginuser(
   user_id int not null primary key auto_increment,
   user_name varchar(255),
   user_pass varchar(255)
   );
insert into loginuser(user_name,user_pass) values("Admin@gmail.com","123");



-- Doctor profile table.
CREATE TABLE doctor_profiles (
    doctor_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    name VARCHAR(255),
    date_of_birth DATE,
    contact_info VARCHAR(255),
    qualifications TEXT,
    specializations TEXT,
    license_number VARCHAR(50),
    years_of_experience INT,
    FOREIGN KEY (user_id) REFERENCES loginuser(user_id)
);

-- Work schedule table.
CREATE TABLE work_schedule (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT,
    day_of_week VARCHAR(15),
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(doctor_id)
);

-- Appointments table.
CREATE TABLE appointments (
    appointment_id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT,
    doctor_id INT,
    appointment_time DATETIME,
    status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked',
    FOREIGN KEY (doctor_id) REFERENCES doctor_profiles(doctor_id),
    FOREIGN KEY (patient_id) REFERENCES loginuser(user_id)
);
3. In the login.js file, change the details of the mysql database(insert the name of ur database and ur sql password).
4. Open the vs code terminal (or whichever software ur using) and type the following command: npm install body-parser mysql express
5. Run the server by typing "node login.js" in the terminal.
6. You can view the website by typing "localhost:3500" in ur browser.
