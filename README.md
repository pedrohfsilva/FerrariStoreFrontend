# Ferrari Store

<p align="center">
  <img width="200" src="https://github.com/LeticiaBN/FerrariStore/blob/main/initial-design/img/logo.png?raw=true">
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

The Ferrari Store is an online store for selling collectible items, offering a curated selection of miniature cars and helmets. A must-visit for motorsport enthusiasts, it offers high-quality replicas of Ferrari vehicles and iconic racing helmets, perfect for collectors and fans. As a unique feature, you can even listen to the engine sounds of our car miniatures. Check out the initial website design here: [link].

Describe how your project implements the functionality in the requirements. Diagrams can help a lot here.


### Requirements

Our website supports both customers and administrators, with user and product registration. Customers can select products, choose quantities, and add them to a cart for purchase with a credit card. As a unique feature, we included a system to press a button in the product page and play engine sounds for the car miniatures in our store. All pages are fully responsive.


### Navigation Diagram


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
      Usuário---Carrinho
      
```

### Mockup images (Milestone 1)

The Mockup images for this site can be found <a href='https://github.com/LeticiaBN/FerrariStore/tree/596a93f7db89f1ddb446b2b4f2ebcaa334f32165/mockups'>here</a>

</br>

### Comments about the code



### Test Plan


### Test Results


### Build Procedures


### Problems

### Comments




