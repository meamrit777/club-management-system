import { useSelector } from "react-redux";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import UserAddressCard from "../components/UserProfile/UserAddressCard";
import UserInfoCard from "../components/UserProfile/UserInfoCard";
import UserMetaCard from "../components/UserProfile/UserMetaCard";
import { selectLoggedInUser } from "../store/authSlice";

export default function UserProfiles() {
  const loggedInUser = useSelector(selectLoggedInUser);

  return (
    <>
      <PageMeta
        title="React.js Profile Dashboard | DYC"
        description="This is React.js Profile Dashboard page for DYC"
      />
      <PageBreadcrumb pageTitle="Profile" />
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <UserMetaCard user={loggedInUser} onSave={() => {}} />
          <UserInfoCard user={loggedInUser} onSave={() => {}} />
          <UserAddressCard user={loggedInUser} />
        </div>
      </div>
    </>
  );
}
