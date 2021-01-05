# innet get start
To start developing run this
```bash
npm start
```
To build production run this
```bash
npm run build
```
*You can find the production bundle in `public` folder*

### TypeScript
The main file is `index.js` (`index.ts`, `index.tsx`) from `src` folder.  
You can import `.js`, `.ts` or `.tsx` files into any script file.  
So you can use `TypeScript` or not or use somewhere.  
If you don't want to use `TypeScript`,
you can remove `tsconfig.json` and `declaration.d.ts`.

### SCSS
You can import `.css` or `.scss` into a script.
So you can use `SCSS` or not.
```typescript jsx
import './index.css'
import './index.scss'
```
### JSON
You can import `.json` file into a script.
```typescript jsx
import settings from './settings.json'
```
### HTTPS
Add `localhost.crt` and `localhost.key` to the root of the application to use HTTPS.
### .env
You can create and set up `.env` file to change some features.  
These options are used by default.
```dotenv
# you can use remote API, for example PROXY=https://localhost:9000
PROXY=false

# you can change the static server port
PORT=3000

# you can change directory and file name of ssl certificates
SSL_CRT_FILE=localhost.crt
SSL_KEY_FILE=localhost.key

# you can generate sourcemap for production build
GENERATE_SOURCEMAP=false

# by default index.js includes all styles,
# but you can keep styles into index.css with CSS_EXTRACT=true
CSS_EXTRACT=false

# import styles from './App.css'
# you can use css modules with CSS_MODULES=true
CSS_MODULES=false
```
