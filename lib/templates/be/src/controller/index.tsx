import { App } from '/view'

export default (
  <server onStart={url => console.log(`open: ${url}`)}>
    <App />
  </server>
)
