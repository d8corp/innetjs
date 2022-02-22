export default function App () {
  return (
    <server onStart={url => console.log(`open: ${url}`)}>
      Hello World!
    </server>
  )
}
