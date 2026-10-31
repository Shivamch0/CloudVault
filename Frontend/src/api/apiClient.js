import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send HttpOnly cookies automatically
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor to attach Bearer token if stored in localStorage (dual support: cookie + header)
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("cloudvault_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors consistently
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            // If token expired, clear localStorage
            localStorage.removeItem("cloudvault_token");
            localStorage.removeItem("cloudvault_user");
        }
        const message =
            error.response?.data?.message ||
            error.message ||
            "An unexpected network error occurred";
        return Promise.reject(new Error(message));
    }
);

/**
 * Upload file directly to Amazon S3 via Presigned PUT URL.
 * Strictly uses an isolated Axios instance with NO cookies and NO backend authorization headers!
 */
export const uploadFileToS3 = async (presignedUrl, file, onProgress, cancelTokenSource) => {
    return await axios.put(presignedUrl, file, {
        headers: {
            "Content-Type": file.type || "application/octet-stream",
        },
        withCredentials: false, // Must be false for direct S3 presigned PUT
        cancelToken: cancelTokenSource ? cancelTokenSource.token : undefined,
        onUploadProgress: (progressEvent) => {
            if (progressEvent.total && onProgress) {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                );
                onProgress(percentCompleted);
            }
        },
    });
};

