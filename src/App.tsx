import ChessGame from './components/ChessGame'
import styled from 'styled-components'

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
`

function App() {
  return (
    <AppContainer>
      <ChessGame />
    </AppContainer>
  )
}

export default App 