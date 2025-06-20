# CODESYNERGY

# CodeBuddy - Collaborative Coding Platform for Students 

CodeBuddy is a  ** collaborative coding ** platform where students can:
- Solve curated DSA problems
- Track their coding progress (score, coins, badges)
- Add friends & view their progress
- Share interview experiences

## 📁 Folder Structure
├── controllers/        # Logic for auth, problems, etc.
├── models/             # Mongoose schemas
├── routes/             # API route definitions
├── middlewares/        # Authentication and access control
├── utils/              # Seed scripts, helper files
├── data/               # Raw JSON data for seeding
├── config/             # DB connection setup
├── server.js           # Entry point
└── README.md           # Project documentation


# node index.js 
![image](https://github.com/user-attachments/assets/55d37b0b-e625-480e-b994-e97565299098)

# GET= http://localhost:8000/
![image](https://github.com/user-attachments/assets/8df98e8e-4392-44dd-9e99-03ee6057b6a9)

## 🛡️ Authentication System (JWT Based):
--
### 📝 Registration
- **POST** `/register`
- Stores: `username`, `email`, `password`
- Password hashed using **bcrypt**
- > 🔒 Example:
![image](https://github.com/user-attachments/assets/17e2997b-6d8a-4890-a308-46fc681f32ee)

  

### In DB after registration
- > 🔒 Example:
![image](https://github.com/user-attachments/assets/ef427368-d252-481b-917a-0a6bc0930c8e)

- ** bcrypt ** - bcrypt is any hash algorithm which convert the normal string like pass (eg. test123 to "$2b$10$1aLPmFhsyhRFULppfdaMJuNnvgWjJpi2soKhKVnh0r1JTzHEy6fXa" )
- to avoid the password breach from the database 

----

### if your making request again  ir shows the user exists 
- > 🔒 Example:
![image](https://github.com/user-attachments/assets/7adfa3f7-cc46-43b8-80b8-f13105637316)

---

### 🔐 Login
- **POST** `/login`
- Returns a **JWT token** valid for a specific time
- > 🔒 Example:

  ```bash
![image](https://github.com/user-attachments/assets/82bbcf2f-1a8d-4c62-ab20-ddc579f0f3b8)

---


### 🔒 Protected Route (JWT Required)
- **GET** `/user-profile`
- Checks JWT token using `verifyToken` middleware
- this will first check the jwt token if the token is valid  and  internally  it verify
  - > 🔒 Example:
    
    ```bash
- ![image](https://github.com/user-attachments/assets/06139d5a-4126-4483-b96d-1c200d2f5351)

  ---
  
  ## 🔐 How Passwords are Secured (bcrypt)
Passwords are hashed using `bcrypt` before saving to MongoDB.

---

```bash
Input Password: test123
Stored Hash: $2b$10$1aLPmFhsyhRFULppfdaMJuN...
---
#Schema's
- > 🔒 Example:
![image](https://github.com/user-attachments/assets/444bf563-3e2b-44c0-924b-e6261020b35e)
---

```bash

Visit: http://localhost:8000

---
## Seeding the Database
Step 1: Add problem sets in data/problems.json
Step 2: Run the seeder script

```bash
node utils/seedProblems.js

---
##  API Test Demo
GET / → API is live
POST /register → Registers a new user
POST /login → Returns JWT token
GET /user-profile → Returns profile info (JWT protected)

---
##  Technologies Used
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Authentication: JWT, Bcrypt
- Data Seeding: JSON + Custom Script


##  API Endpoints - Problem Routes

###  GET all problems
http://localhost:8000/problems
---
![image](https://github.com/user-attachments/assets/dd66b54b-1720-42fe-878f-31c71a28090f)

---

###  Filter problems by difficulty

http://localhost:8000/difficulty/Easy

- Case-sensitive (use "Easy", "Medium", "Hard")

![image](https://github.com/user-attachments/assets/36d862ab-da59-447d-9add-1f0eabb2a945)

---

###  Filter problems by tag

---
- Tags like: `Array`, `String`, `Stack`, `Queue`


```markdown
> ⚠️ Note: All filters are case-sensitive. Use "Easy" not "easy", "Array" not "array

---
http://localhost:8000/problemType/Array
![image](https://github.com/user-attachments/assets/0ec7388b-00ac-4bd8-9454-5db088ccf007)










👨‍💻 Author
.Ajay Jadhav

💼 Building CodeBuddy with ❤️
