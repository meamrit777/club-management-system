import { Route, Routes } from "react-router";
import SignIn from "../pages/AuthPages/SignIn";
import SignUp from "../pages/AuthPages/SignUp";
import NotFound from "../pages/OtherPage/NotFound";
import GuestOnly from "./middlewares/GuestOnly";

const GuestRouter = () => {
  return (
    <Routes>
      {/* <Route path="/" element={<GuestOnly component={HomeScreen} />} /> */}

      {/* Auth Layout */}
      <Route path="/signin" element={<GuestOnly component={SignIn} />} />
      <Route path="/signup" element={<GuestOnly component={SignUp} />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default GuestRouter;
