import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from 'browser-image-compression';
import { storage } from '../firebaseConfig'; // Ensure you have the correct path to your firebaseConfig

export const uploadImage = async (file: File, userID: string) => {
    const storageRef = ref(storage, `profilePictures/${userID}/${file.name}`);
    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error("Error uploading image: ", error);
        throw error;
    }
};

export const compressImage = async (imageFile: File) => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 500,
        useWebWorker: true
    };

    try {
        const compressedFile = await imageCompression(imageFile, options);
        return compressedFile;
    } catch (error) {
        console.error("Error compressing image: ", error);
        throw error;
    }
};
