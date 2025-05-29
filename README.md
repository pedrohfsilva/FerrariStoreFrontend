# Ferrari Store

<p align="center">
  <img width="200" src="https://github.com/LeticiaBN/FerrariStore/blob/main/initial-design/img/ferrari.jpg?raw=true">
</p>

### Authors
| Name                                                       | USP number |
| :--------------------------------------------------------- | :--------- |
| [Enzo Tonon Morente](https://github.com/EnzoTM)     | 14568476   |
| [Letícia Barbosa Neves](https://github.com/LeticiaBN) | 14588659   |
| [Pedro Henrique Ferreira Silva](https://github.com/pedrohfsilva)  | 14677526   |

### Website

*Link

### Project Description

The Ferrari Store is an online store for selling collectible items, offering a curated selection of miniature cars and helmets. A must-visit for motorsport enthusiasts, it offers high-quality replicas of Ferrari vehicles and iconic racing helmets, perfect for collectors and fans. As a unique feature, you can even listen to the engine sounds of our car miniatures.

### Build Procedures

This project is divided into two parts:

* `frontend` (Next.js)
* `backend` (Node.js)

Follow the steps below to run the application locally.
#### 1. Open Two Terminals and Navigate to the Project Folders

In the root directory of the project, open **two separate terminals**:

* In Terminal 1:

  ```bash
  cd FerrariStore/final-version/frontend
  ```

* In Terminal 2:

  ```bash
  cd FerrariStore/final-version/backend
  ```

---

#### 2. Install Dependencies

In **both** terminals, run the following command:

```bash
npm install
```

This will install all the required dependencies for both frontend and backend.

---

#### 3. Set Environment Variables

##### In the `frontend` folder:

Create a file named `.env` and add the following:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

##### In the `backend` folder:

Create a file named `.env` and add the following:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=ferrari_secret_jwt_2024
```

Replace `your_mongodb_connection_string_here` with the actual MongoDB URI you'll get in the next step.

---

#### 4. Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).
2. Create an account or log in.
3. Create a new **cluster** (or use an existing one).
4. Click **"Connect"** to get your **MongoDB connection string (URI)**.
5. Copy the URI and paste it in the `.env` file inside the `backend` folder where it says `your_mongodb_connection_string_here`.
6. Go to **Network Access** in MongoDB Atlas.
7. Add your **current IP address** to the list of allowed IPs.

---

#### 5. Run the Project

In both terminals, run:

```bash
npm run dev
```

* The **frontend** will be available at: `http://localhost:3000`
* The **backend** will be running at: `http://localhost:5000`

---


# For reviwers 

You can create your own account to thest the user features.

Use the following admin credentials to test admin features:

- Login: admin@gmail.com
- Password: admin123

# Navigation Diagram


```mermaid
  graph TD;
      Home[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/homepage.png?raw=true'>Home</a>]---LogIn[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/login.png?raw=true'>LogIn</a>];
      Home---Cars[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/cars.png?raw=true'>Cars</a>];
      Home---Formula1[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/formula1.png?raw=true'>Formula1</a>];
      Home---Helmets[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/helmets.png?raw=true'>Helmets</a>];
      Home---Produto[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/product.png?raw=true'>Produto</a>];
      Home---Carrinho[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/cart.png?raw=true'>Cart</a>];
      Helmets---Produto
      Formula1---Produto
      Cars---Produto
      Produto---LogIn
      Produto---Carrinho
      LogIn---Admin
      Admin---AdminDashboard[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/admin.png?raw=true'>AdminDashboard</a>];
      LogIn---Usuário
      Usuário---Profile[<a href='https://github.com/LeticiaBN/FerrariStore/blob/main/mockups/profile.png?raw=true'>Profile</a>];
      Usuário---Carrinho
      
```

### Mockup images (Milestone 1)

The Mockup images for this site can be found <a href='https://github.com/LeticiaBN/FerrariStore/tree/596a93f7db89f1ddb446b2b4f2ebcaa334f32165/mockups'>here</a>

### The requirements met by the project
Our website provides comprehensive functionality for both customers and administrators.

**For administrators**, the system offers complete inventory management capabilities, including stock quantity adjustments, product additions and removals, as well as the ability to create new administrative users. All management tools are accessible through an intuitive dashboard.

**For customers**, we provide a full-featured shopping system where users can create personal accounts, browse our product catalog, select desired quantities, and add items to their cart. The checkout process includes credit card payments and delivery address management. Users can also update their profile information at any time.

As the specific functionality, we've implemented an interactive feature that allows customers to hear authentic engine sounds for each car miniature directly on the product page through a dedicated button.

All website pages feature **fully responsive design**, ensuring an optimized user experience across all devices from desktops to smartphones.

# Comments about the code

# Test Plan and Test Results

#### User (Client) login and registration
The registration process was tested by simulating the completion of all mandatory fields—such as full name, a valid email address, password, and password confirmation—with valid information that complies with the presumably established validation criteria. The registration of new users was successfully completed. The system effectively validated the input data, displayed clear and helpful guidance messages during the process, and the user account was created without any issues. After creation, the user was appropriately redirected, either to the login page for immediate authentication or to a user dashboard.

#### Administrator account
An administrator account can only be created by another administrator or through a manual change in the database. We attempted to allow an administrator to delete their own account; however, the system does not permit this action. Furthermore, we created several products through the administrator account and also changed their stock values, which worked perfectly as expected. The only thing to note during our tests is that if an administrator promotes another user to an administrator while that user is logged in, they will have to log out and log back in for the administration area to appear in the header.

#### Product Sale
We tested adding products to the cart in several ways, including entering the product page and adding it to the cart, clicking to add it to the cart from outside the product page, and also, once in the cart, increasing and decreasing the quantity of products. In all cases, it was never possible to exceed the maximum number of products in stock. Additionally, when finalizing the purchase, if the user had not added a credit card and/or address, they were required to go to their profile page and register this information. Upon completing the purchase, the purchased products were duly removed from the stock.

#### The group's functionality
We tested both the addition of audio files and their playback by the user. Both cases worked perfectly. When a user listens to the audio, they do not need to wait for it to finish, as they are able to pause the audio in the middle.

# Comments
For convenience, we implemented the backend during the second milestone, so it wasn't necessary to use the suggested mockup tools.
