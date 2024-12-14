# Mountain
Mountain is a simple, yet powerful, framework/template for web applications. I made this because I was bored at how much is needed to simply implementing creating the real functionality of an application and how much it kills the pleasure of programming. Now, when I need it, I can simply add stuff here and don't bother anymore.

## Features:
1. Messenger — You can use it to send error messages or general session status via the API.
2. Model — You can describe database schema for your application and the model module will keep the database up-to-date, generate functions so you don't have to bother with SQL and generate API when you say so.
3. User — Login, logout.

## Quick start
```bash
# Clone repo
git clone https://github.com/YetAnotherFurryMan/Mountain.git [Your App Name]
cd [Your App Name]
# Install dependences
npm install
# Run application to see if everythink is working fine
npm start
```
Then you can start playing around. Inside `/app` directory you can put anything related to your application, but `app.js`, `model.json` and `config.json` are obligatory. The `app.js` is where you write the backend for your app, in `model.json` you describe the schema of the database and in `config.json` you can change the behavior of Mountain and list themes with corresponding variants. Furthermore, inside `/www` you will find four folders: `/public`, `/css`, `/private` and `/mountain`. The files in the first two are public for anyone, you can do whatever you want in there. Remember that there should be `index.html` and `login.html` inside `/public`, because Mountain sometimes redirects to them. The `/private` directory is, who would have thought, for logged-in users only, again you can do whatever you want, but Mountain expects `index.html` to be there. The last one, `/mountain`, is for the Mountain Public API, so you better leave it alone, nothing you cannot do with the `/public`, `/private` directories and `app.js` file. All your CSS you can put inside `www/css` folder together with themes. Each theme has its own folder in `www/css` with `theme.css` inside (this file describes what color to use and defaults), variants are other CSS files in theme's directory (they describe only colors).

## Examples
There are some examples! When you download fresh Mountain clone, you can see files listed below as frontend examples. Also, there are sample `/app` contents you can study and two primitive themes (with two variants each) inside `www/css`.

- `www/public/messenger.html`
- `www/public/user.html`
- `www/public/theme.html`
- `www/private/model.html`
