const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");
const session = require('express-session');
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/assets", express.static("assets"));

// Initialize session
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "Your database name "
});

// Connect to the database
connection.connect(function (error) {
    if (error) throw error;
    else console.log("Connected to the database successfully!");
});

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "/index.html"));
});

// Handle login post
app.post("/", function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    connection.query("select * from loginuser where user_name = ? and user_pass = ?", [username, password], function (error, results, fields) {
        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.userId = results[0].id; // Store user id in the session
            res.redirect("/welcome");
        } else {
            res.redirect("/");
        }
    });
});

app.get("/welcome", function (req, res) {
    if (req.session.loggedin) {
        res.sendFile(path.join(__dirname, "/welcome.html"));
    } else {
        res.redirect("/");
    }
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session.loggedin) {
        next();
    } else {
        res.redirect('/');
    }
}
// Assuming other requires like mysql, express, bodyParser, session are already defined


// ... your existing requires and app setup

app.get("/doctor/profile", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "/profile.html"));
});

// Serve the form for creating a new doctor profile
app.get("/doctor/create-form", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "/create-profile.html"));
});

// Serve the form for viewing a doctor profile
app.get("/doctor/view-form", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "/view-profile.html"));
});

// Serve the form for updating a doctor profile
app.get("/doctor/update-form", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "/update-profile.html"));
});

// Serve the form for deleting a doctor profile
app.get("/doctor/delete-form", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "/delete-profile.html"));
});
// ... the rest of your routes and app.listen



// CRUD Operations for Doctor Profiles

// Create Doctor Profile
app.post("/doctor/create", isAuthenticated, (req, res) => {
    const { user_id, name, date_of_birth, contact_info, qualifications, specializations, license_number, years_of_experience } = req.body;
    const insertQuery = `INSERT INTO doctor_profiles (user_id, name, date_of_birth, contact_info, qualifications, specializations, license_number, years_of_experience) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    connection.query(insertQuery, [user_id, name, date_of_birth, contact_info, qualifications, specializations, license_number, years_of_experience], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).send('Error creating the doctor profile.');
        }
        res.send(`Doctor profile created with ID: ${results.insertId}`);
    });
});

/// View Doctor Profile
app.get("/doctor/view", isAuthenticated, (req, res) => {
    // Using req.query to get doctor_id from the query string parameter
    const doctorId = req.query.doctor_id;
    connection.query('SELECT * FROM doctor_profiles WHERE doctor_id = ?', [doctorId], (error, results) => {
        if (error) {
            return res.status(500).send('Error on the server.');
        }
        if (results.length > 0) {
            // Sending the result back. Consider formatting this data as HTML or JSON
            res.json(results);
        } else {
            res.status(404).send('Doctor profile not found.');
        }
    });
});


// Update Doctor Profile
app.post("/doctor/update", isAuthenticated, (req, res) => {
    const { doctor_id, name, date_of_birth, contact_info, qualifications, specializations, license_number, years_of_experience } = req.body;
    const updateQuery = `UPDATE doctor_profiles SET name = ?, date_of_birth = ?, contact_info = ?, qualifications = ?, specializations = ?, license_number = ?, years_of_experience = ? 
                         WHERE doctor_id = ?`;

    connection.query(updateQuery, [name, date_of_birth, contact_info, qualifications, specializations, license_number, years_of_experience, doctor_id], (error, results) => {
        if (error) {
            return res.status(500).send('Error updating the doctor profile.');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('Doctor profile not found.');
        }
        res.send('Doctor profile updated successfully.');
    });
});

// Delete Doctor Profile
app.post("/doctor/delete", isAuthenticated, (req, res) => {
    const { doctor_id } = req.body;

    // First, delete or handle all related appointments
    const deleteAppointmentsQuery = 'DELETE FROM appointments WHERE doctor_id = ?';

    connection.query(deleteAppointmentsQuery, [doctor_id], (appointmentError, appointmentResults) => {
        if (appointmentError) {
            console.error(appointmentError);
            return res.status(500).send('Error deleting the doctor\'s appointments.');
        }
        
        // If appointments are handled, proceed to delete the doctor profile
        const deleteDoctorQuery = 'DELETE FROM doctor_profiles WHERE doctor_id = ?';

        connection.query(deleteDoctorQuery, [doctor_id], (doctorError, doctorResults) => {
            if (doctorError) {
                console.error(doctorError);
                return res.status(500).send('Error deleting the doctor profile.');
            }
            if (doctorResults.affectedRows === 0) {
                return res.status(404).send('Doctor profile not found.');
            }
            res.send('Doctor profile and related appointments deleted successfully.');
        });
    });
});


// Start server





// ... [your existing code]

// Route to serve the Appointment Manager main page
app.get("/appointments/manage", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "appointment-manager.html")); // Ensure this file exists
});

// Route to view appointments for a doctor
app.post("/appointments/view", isAuthenticated, function (req, res) {
    const { doctor_id } = req.body;
    connection.query("SELECT * FROM appointments WHERE doctor_id = ?", [doctor_id], function(error, results) {
        if (error) {
            return res.status(500).send('Error on the server.');
        }
        // Send the results in a tabular format or as JSON
        res.json(results);
    });
});

// Route to create a new appointment
app.post("/appointments/schedule", isAuthenticated, function (req, res) {
    const { patient_id, doctor_id, appointment_time } = req.body;
    
    const insertQuery = "INSERT INTO appointments (patient_id, doctor_id, appointment_time) VALUES (?, ?, ?)";
    
    connection.query(insertQuery, [patient_id, doctor_id, appointment_time], function(error, results) {
        if (error) {
            return res.status(500).send('Error on the server.');
        }
        res.send(`Appointment created with ID: ${results.insertId}`);
    });
});

// Route to update an existing appointment
app.post("/appointments/update", isAuthenticated, function (req, res) {
    const { appointment_id, appointment_time, status } = req.body;
    
    // Check if new appointment time is available
    connection.query("SELECT * FROM appointments WHERE appointment_time = ? AND status = 'booked'", [appointment_time], function(err, results) {
        if (results.length > 0) {
            return res.status(400).send('The new appointment time is already booked.');
        }
        
        // Update the appointment
        const updateQuery = "UPDATE appointments SET appointment_time = ?, status = ? WHERE appointment_id = ?";
        connection.query(updateQuery, [appointment_time, status, appointment_id], function(error, results) {
            if (error) {
                return res.status(500).send('Error on the server.');
            }
            if (results.affectedRows === 0) {
                return res.status(404).send('Appointment not found.');
            }
            res.send("Appointment updated successfully.");
        });
    });
});

// Route to cancel an existing appointment
app.post("/appointments/cancel", isAuthenticated, function (req, res) {
    const { appointment_id } = req.body;
    
    connection.query("SELECT * FROM appointments WHERE appointment_id = ?", [appointment_id], function(err, results) {
        if (err) {
            return res.status(500).send('Error on the server.');
        }
        if (results.length === 0) {
            return res.status(404).send('Appointment not found.');
        }
        
        const appointmentTime = results[0].appointment_time; // assuming the appointment_time is in the results
        
        const cancelQuery = "UPDATE appointments SET status = 'cancelled' WHERE appointment_id = ?";
        connection.query(cancelQuery, [appointment_id], function(error, results) {
            if (error) {
                return res.status(500).send('Error on the server.');
            }
            res.send(`The appointment scheduled at ${appointmentTime} is cancelled.`);
        });
    });
});
// ... [other requires like mysql, express, bodyParser, session]

// Set up your express app, session, and static directory
// Set up your MySQL connection
// Set up your app routes for login and authentication
// ...

// View Appointments
app.get("/appointments/view", isAuthenticated, (req, res) => {
    // Assuming doctor_id is stored in session after login
    const doctorId = req.session.userId;
    connection.query('SELECT * FROM appointments WHERE doctor_id = ?', [doctorId], (error, results) => {
      if (error) {
        return res.status(500).send('Error on the server.');
      }
      let html = '<table><tr><th>ID</th><th>Patient ID</th><th>Appointment Time</th><th>Status</th></tr>';
      results.forEach(appointment => {
        html += `<tr><td>${appointment.appointment_id}</td><td>${appointment.patient_id}</td><td>${appointment.appointment_time}</td><td>${appointment.status}</td></tr>`;
      });
      html += '</table>';
      res.send(html); // Send the HTML table back to the client
    });
  });
  
  // Schedule an Appointment
app.post("/appointments/schedule", isAuthenticated, function (req, res) {
    // Extracting form data sent from the client
    const { patient_id, doctor_id, appointment_time } = req.body;
    
    // SQL query to insert a new appointment into the database
    const insertQuery = "INSERT INTO appointments (patient_id, doctor_id, appointment_time, status) VALUES (?, ?, ?, 'booked')";
    
    // Executing the SQL query
    connection.query(insertQuery, [patient_id, doctor_id, appointment_time], (error, results) => {
        if (error) {
            console.error(error); // Log any error to the console for debugging
            return res.status(500).send('Error scheduling the appointment.');
        }
        // Sending back a success message with the newly created appointment ID
        res.send(`Appointment created with ID: ${results.insertId}`);
    });
});


  
  // Update an Appointment
  app.post("/appointments/update", isAuthenticated, (req, res) => {
    const { appointment_id, patient_id, doctor_id, appointment_time, status } = req.body;
    connection.query('UPDATE appointments SET patient_id = ?, doctor_id = ?, appointment_time = ?, status = ? WHERE appointment_id = ?', 
                     [patient_id, doctor_id, appointment_time, status, appointment_id], (error, results) => {
      if (error) {
        return res.status(500).send('Error updating the appointment.');
      }
      if (results.affectedRows === 0) {
        return res.status(404).send('Appointment not found.');
      }
      res.send(`Appointment updated successfully.`);
    });
  });
  
  // Cancel an Appointment
  app.post("/appointments/cancel", isAuthenticated, (req, res) => {
    const { appointment_id } = req.body;
    connection.query('UPDATE appointments SET status = "cancelled" WHERE appointment_id = ?', [appointment_id], (error, results) => {
      if (error) {
        return res.status(500).send('Error cancelling the appointment.');
      }
      if (results.affectedRows === 0) {
        return res.status(404).send('Appointment not found.');
      }
      res.send(`Appointment cancelled successfully.`);
    });
  });
  
// ...your existing setup code (imports, app.use middleware, etc.)

// Serve the form for viewing appointments
app.get("/appointments/view-form", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "view-appointments.html"));
});

// Serve the form for scheduling a new appointment
app.get("/appointments/schedule-form", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "schedule-appointment.html"));
});

// Serve the form for updating an appointment
app.get("/appointments/update-form", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "update-appointment.html"));
});

// Serve the form for cancelling an appointment
app.get("/appointments/cancel-form", isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, "cancel-appointment.html"));
});

// ...the rest of your server code, including the POST request handlers for these actions


  

app.get("/appointments", isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, "appointment-manager.html")); // Ensure this file exists in your directory
});



// Start the server
app.listen(3500, () => {
    console.log("Server is running on port 3500");
});
