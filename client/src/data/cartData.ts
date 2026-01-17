
import cartImage1 from "@/assets/images/products/cart-1-1.jpg";
import cartImage2 from "@/assets/images/products/cart-1-2.jpg";
import cartImage3 from "@/assets/images/products/cart-1-3.jpg";
import cartImage4 from "@/assets/images/products/cart-1-4.jpg";

const cartItems = [
    {
        id: 1,
        image: cartImage1,
        title: "Pain Relievers",
        price: 15.00,
        quantity: 1,
        total: 15.00,
    },
    {
        id: 2,
        image: cartImage2,
        title: "Antihypertensives",
        price: 15.00,
        quantity: 1,
        total: 15.00,
    },
    {
     id: 3,
     image: cartImage3,
     title: "Insulin (for Diabetes):",
     price: 15.00,
     quantity: 1,
     total: 15.00,
 },
 {
     id: 4,
     image: cartImage4,
     title: "Anti-inflammatory",
     price: 15.00,
     quantity: 1,
     total: 15.00,
 },
];

const couponSection = {
    placeholder: "Enter coupon code",
};



export { cartItems, couponSection };
