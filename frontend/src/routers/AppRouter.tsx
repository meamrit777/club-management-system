import { Route, Routes } from "react-router";

import { useAuth } from "../hooks/useAuth";

import AppLayout from "../layout/AppLayout";
import Blank from "../pages/Blank";
import Calendar from "../pages/Calendar";
import BarChart from "../pages/Charts/BarChart";
import LineChart from "../pages/Charts/LineChart";
import Home from "../pages/Dashboard/Home";
import FormElements from "../pages/Forms/FormElements";
import BasicTables from "../pages/Tables/BasicTables";
import Alerts from "../pages/UiElements/Alerts";
import Avatars from "../pages/UiElements/Avatars";
import Badges from "../pages/UiElements/Badges";
import Buttons from "../pages/UiElements/Buttons";
import Images from "../pages/UiElements/Images";
import Videos from "../pages/UiElements/Videos";
import UserProfiles from "../pages/UserProfiles";

const AppRouter = () => {
  const { loggedInUser } = useAuth();

  return (
    <Routes>
      {/* Dashboard Layout */}
      <Route element={<AppLayout />}>
        <Route index path="/" element={<Home />} />

        {/* Others Page */}
        <Route path="/profile" element={<UserProfiles />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/blank" element={<Blank />} />

        {/* Forms */}
        <Route path="/form-elements" element={<FormElements />} />

        {/* Tables */}
        <Route path="/basic-tables" element={<BasicTables />} />

        {/* Ui Elements */}
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/avatars" element={<Avatars />} />
        <Route path="/badge" element={<Badges />} />
        <Route path="/buttons" element={<Buttons />} />
        <Route path="/images" element={<Images />} />
        <Route path="/videos" element={<Videos />} />

        {/* Charts */}
        <Route path="/line-chart" element={<LineChart />} />
        <Route path="/bar-chart" element={<BarChart />} />
      </Route>
    </Routes>
  );
};

export default AppRouter;
