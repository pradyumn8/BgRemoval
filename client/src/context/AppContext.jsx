import { createContext, useState, useEffect } from "react";
import { useAuth, useClerk, useUser } from '@clerk/clerk-react';  
import axios from 'axios';
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export const AppContext = createContext();

const AppContextProvider = (props) => {
    const [credit, setCredit] = useState(false);  // Initialize to null or 0
    const [image, setImage] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    const navigate = useNavigate();

    const { getToken } = useAuth();
    const { isSignedIn } = useUser();  // Added useUser hook
    const { openSignIn } = useClerk();

    // Function to load credit data from API
    const loadCreditsData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/credits`, {
                headers: { Authorization: `Bearer ${token}` }  // Correct header
            });
            if (data.success) {
                setCredit(data.credits);  // Correctly update the credit state
                console.log(data.credits);
            } else {
                toast.error("Failed to retrieve credits.");
            }
        } catch (error) {
            console.error("Error loading credits:", error.response || error.message);
            toast.error("Failed to load credits. Please try again.");
        }
    };

    // Function to handle image background removal
    const removeBg = async (image) => {
        try {
            if (!isSignedIn) {
                return openSignIn();  // Redirect to sign-in if user is not signed in
            }
            setImage(image);  // Store the image
            setResultImage(false);  // Reset result image
            navigate('/result');  // Navigate to the result page
            const token = await getToken()
            const formData = new FormData()
            image && formData.append('image',image)
            const {data} = await axios.post(backendUrl+'/api/image/remove-bg',formData,{headers:{token}})
            if (data.success) {
                setResultImage(data.resultImage)
                data.creditBalance && setCredit(data.creditBalance)
            } else {
                toast.error(data.message)
                data.creditBalance && setCredit(data.creditBalance)
                if(data.creditBalance === 0){
                    navigate('/buy')
                }
            }
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };

    // UseEffect to load credit data when user signs in
    useEffect(() => {
        if (isSignedIn) {
            loadCreditsData();
        }
    }, [isSignedIn]);  // Load credits whenever the user signs in

    // Context value to be provided globally
    const value = {
        credit,
        setCredit,
        loadCreditsData,
        backendUrl,
        image,
        setImage,
        removeBg,
        resultImage,setResultImage,
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};

export default AppContextProvider;
