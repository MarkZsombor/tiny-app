# MyTinyApp Project

MyTinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["Screenshot of the urls page"](https://github.com/MarkZsombor/tiny-app/blob/master/docs/urls_page.png)
!["Screenshot of the Login page"](https://github.com/MarkZsombor/tiny-app/blob/master/docs/login_page.png)
!["Screenshot for a tiny url page"](https://github.com/MarkZsombor/tiny-app/blob/master/docs/url_id_page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `node tiny-app.js` command.

## Features and Functionality

After registering an account, users can create short urls that will be associated with their account. These urls can be shared anywhere.

Client-side session management (implemented using cookie-sessions) makes the application stateful without compromising security. Bcrypt is used for password encryption to ensure the protection of user information.
