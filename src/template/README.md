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

### SASS
You can import `.css` or `.scss` into a script.
So you can use `SASS` or not.
```typescript jsx
import './index.css'
import './index.scss'
```
If you import styles to a variable you get scoped styles.
```typescript jsx
import styles1 from './index.css'
import styles2 from './index.scss'
```
### JSON
You can import `.json` file into a script.
```typescript jsx
import test from './index.json'
```
