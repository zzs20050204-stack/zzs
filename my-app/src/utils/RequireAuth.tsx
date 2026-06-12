import {useNavigate} from 'react-router-dom';
import { useSelector } from 'react-redux';
import {useEffect} from 'react';

interface Iprops{
    allowed:boolean;
    redirectTo:string;
    children:React.ReactNode;
}

function RequireAuth({allowed,redirectTo,children}:Iprops){
    const {token}=useSelector((state:any)=>state.auth)
    const navigate=useNavigate();
    const isLogin =token?true:false;

    useEffect(()=>{
        if(allowed!==isLogin){
            navigate(redirectTo);
        }
    },[allowed,isLogin,redirectTo]);

      return allowed===isLogin?<>{children}</>:<></>;


}
export default RequireAuth;