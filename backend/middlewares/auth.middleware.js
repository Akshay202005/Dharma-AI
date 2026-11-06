import jwt from "jsonwebtoken";

// Accept the token from either place:
// 1) Authorization: Bearer <token>  -> mobile app
// 2) httpOnly cookie "token"        -> website
const getToken = (req) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) return header.split(" ")[1];
    return req.cookies?.token;
};

const isAuth = async (req, res, next) => {
    try {
        const token = getToken(req);
        if(!token){
            return res.status(401).json({message: "Token not found."})
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET);

        req.userId = decodeToken.userId;
        next();
    } catch (error) {
        return res.status(401).json({message: "Invalid or expired token"});
    }
}

// Lenient: sets req.userId if logged in, otherwise treats the visitor as a guest
export const optionalAuth = (req, res, next) => {
    try {
        const token = getToken(req);
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        }
    } catch (error) {
        // expired or fake token: continue as a guest
    }
    next();
};

export default isAuth;