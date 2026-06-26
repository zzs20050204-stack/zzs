import {useNavigate} from 'react-router-dom';
import { useSelector } from 'react-redux';
import {useEffect} from 'react';
import { RootState } from '../store';

interface Iprops{
    allowed:boolean;
    redirectTo:string;
    children:React.ReactNode;
}

function RequireAuth({allowed,redirectTo,children}:Iprops){
    const {token}=useSelector((state:RootState)=>state.auth)
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