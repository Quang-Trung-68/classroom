import AppRouter from "./router/AppRouter"
import { ToastContainer } from "react-toastify";
import {  ThemeProvider } from '@mui/material/styles';
import {theme} from "./theme/theme"

function App() {

  return (
    <ThemeProvider theme={theme}>
    <AppRouter/>
    <ToastContainer />
    </ThemeProvider>
  )
}

export default App
