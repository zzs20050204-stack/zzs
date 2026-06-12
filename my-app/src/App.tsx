
import router from './router';
import { RouterProvider } from 'react-router-dom';


function App() {
  return (
    <div className="App">
  
        <RouterProvider router={router}></RouterProvider>
    </div>
    
    
  );
}

export default App;
