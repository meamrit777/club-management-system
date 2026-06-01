import { useModal } from "../../hooks/useModal";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Button from "../ui/button/Button";
import { Modal } from "../ui/modal";

export default function UserMetaCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };
  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
              <img src="/images/user/owner.jpg" alt="user" />
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                Musharof Chowdhury
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">Team Manager</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Arizona, United States</p>
              </div>
            </div>
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              <a
                href="https://www.facebook.com/meamrit777"
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"
                    fill=""
                  />
                </svg>
              </a>

              <a
                href="https://m.me/meamrit777"
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 2C6.48 2 2 6.15 2 11.27c0 2.92 1.45 5.53 3.72 7.24V22l3.24-1.79c.97.27 2 .42 3.04.42 5.52 0 10-4.15 10-9.27S17.52 2 12 2Zm1 12.5-2.55-2.72-4.95 2.72 5.45-5.78 2.6 2.72 4.9-2.72L13 14.5Z"
                    fill=""
                  />
                </svg>
              </a>

              {/* <a
                href="https://www.linkedin.com/company/pimjo"
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59216 3.49323C2.86596 2.87233 3.48886 2.47942 4.16715 2.49978C5.06804 2.52682 5.78422 3.26515 5.78381 4.16645ZM5.83381 7.06645H2.50048V17.4998H5.83381V7.06645ZM11.1005 7.06645H7.78381V17.4998H11.0672V12.0248C11.0672 8.97475 15.0422 8.69142 15.0422 12.0248V17.4998H18.3338V10.8914C18.3338 5.74978 12.4505 5.94145 11.0672 8.46642L11.1005 7.06645Z"
                    fill=""
                  />
                </svg>
              </a> */}

              <a
                href="https://wa.me/7056904012"
                target="_blank"
                rel="noopener"
                className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <svg
                  className="fill-current"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.9 11.9 0 005.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.42ZM12.07 21.8a9.9 9.9 0 01-5.04-1.38l-.36-.21-3.75.98 1-3.65-.24-.37a9.88 9.88 0 01-1.52-5.27c0-5.47 4.45-9.92 9.92-9.92 2.65 0 5.13 1.03 7 2.9a9.83 9.83 0 012.9 7c0 5.47-4.45 9.92-9.91 9.92Zm5.44-7.42c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5a9.08 9.08 0 01-1.68-2.08c-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.26 5.16 4.57.72.3 1.28.48 1.72.61.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                    fill=""
                  />
                </svg>
              </a>
            </div>
          </div>
          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg
              className="fill-current"
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
                fill=""
              />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Edit Personal Information
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update your details to keep your profile up-to-date.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
              <div>
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Social Links
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input type="text" value="https://www.facebook.com/PimjoHQ" />
                  </div>

                  <div>
                    <Label>X.com</Label>
                    <Input type="text" value="https://x.com/PimjoHQ" />
                  </div>

                  <div>
                    <Label>Linkedin</Label>
                    <Input type="text" value="https://www.linkedin.com/company/pimjo" />
                  </div>

                  <div>
                    <Label>Instagram</Label>
                    <Input type="text" value="https://instagram.com/PimjoHQ" />
                  </div>
                </div>
              </div>
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                  Personal Information
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2 lg:col-span-1">
                    <Label>First Name</Label>
                    <Input type="text" value="Musharof" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Last Name</Label>
                    <Input type="text" value="Chowdhury" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Email Address</Label>
                    <Input type="text" value="randomuser@pimjo.com" />
                  </div>

                  <div className="col-span-2 lg:col-span-1">
                    <Label>Phone</Label>
                    <Input type="text" value="+09 363 398 46" />
                  </div>

                  <div className="col-span-2">
                    <Label>Bio</Label>
                    <Input type="text" value="Team Manager" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

// import { useState } from "react";
// import { useModal } from "../../hooks/useModal";

// import Input from "../form/input/InputField";
// import Label from "../form/Label";
// import Button from "../ui/button/Button";
// import { Modal } from "../ui/modal";

// export default function UserMetaCard({ user, onSave, loading = false }) {
//   const { isOpen, openModal, closeModal } = useModal();

//   const [formData, setFormData] = useState({
//     firstName: user?.firstName || "",
//     lastName: user?.lastName || "",
//     email: user?.email || "",
//     phone: user?.phone || "",
//     bio: user?.bio || "",
//     facebook: user?.socials?.facebook || "",
//     messenger: user?.socials?.messenger || "",
//     whatsapp: user?.socials?.whatsapp || "",
//     instagram: user?.socials?.instagram || "",
//     linkedin: user?.socials?.linkedin || "",
//     x: user?.socials?.x || "",
//   });

//   const handleChange = (field, value) => {
//     setFormData((prev) => ({
//       ...prev,
//       [field]: value,
//     }));
//   };

//   const handleSave = async () => {
//     try {
//       await onSave?.(formData);
//       closeModal();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <>
//       <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
//         <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
//           <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
//             <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800">
//               <img
//                 src={user?.avatar || "/images/user/owner.jpg"}
//                 alt={user?.firstName || "user"}
//                 className="object-cover w-full h-full"
//               />
//             </div>

//             <div className="order-3 xl:order-2">
//               <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
//                 {user?.firstName} {user?.lastName}
//               </h4>

//               <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{user?.bio || "No bio"}</p>

//                 {user?.location && (
//                   <>
//                     <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>

//                     <p className="text-sm text-gray-500 dark:text-gray-400">{user.location}</p>
//                   </>
//                 )}
//               </div>
//             </div>

//             <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
//               {user?.socials?.facebook && (
//                 <a
//                   href={user.socials.facebook}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
//                 >
//                   <svg
//                     className="fill-current"
//                     width="20"
//                     height="20"
//                     viewBox="0 0 20 20"
//                     fill="none"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z"
//                       fill=""
//                     />
//                   </svg>
//                 </a>
//               )}

//               {user?.socials?.messenger && (
//                 <a
//                   href={user.socials.messenger}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
//                 >
//                   <svg
//                     className="fill-current"
//                     width="20"
//                     height="20"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       d="M12 2C6.48 2 2 6.15 2 11.27c0 2.92 1.45 5.53 3.72 7.24V22l3.24-1.79c.97.27 2 .42 3.04.42 5.52 0 10-4.15 10-9.27S17.52 2 12 2Zm1 12.5-2.55-2.72-4.95 2.72 5.45-5.78 2.6 2.72 4.9-2.72L13 14.5Z"
//                       fill=""
//                     />
//                   </svg>
//                 </a>
//               )}

//               {user?.socials?.whatsapp && (
//                 <a
//                   href={user.socials.whatsapp}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="flex h-11 w-11 items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
//                 >
//                   <svg
//                     className="fill-current"
//                     width="20"
//                     height="20"
//                     viewBox="0 0 24 24"
//                     fill="none"
//                     xmlns="http://www.w3.org/2000/svg"
//                   >
//                     <path
//                       d="M20.52 3.48A11.86 11.86 0 0012.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.9 11.9 0 005.74 1.46h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.42Z"
//                       fill=""
//                     />
//                   </svg>
//                 </a>
//               )}
//             </div>
//           </div>

//           <button
//             onClick={openModal}
//             className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
//           >
//             Edit
//           </button>
//         </div>
//       </div>

//       <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
//         <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
//           <div className="px-2 pr-14">
//             <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
//               Edit Personal Information
//             </h4>

//             <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
//               Update your details to keep your profile up-to-date.
//             </p>
//           </div>

//           <form
//             className="flex flex-col"
//             onSubmit={(e) => {
//               e.preventDefault();
//               handleSave();
//             }}
//           >
//             <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
//               <div>
//                 <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
//                   Social Links
//                 </h5>

//                 <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
//                   <div>
//                     <Label>Facebook</Label>

//                     <Input
//                       type="text"
//                       value={formData.facebook}
//                       onChange={(e) => handleChange("facebook", e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <Label>X.com</Label>

//                     <Input
//                       type="text"
//                       value={formData.x}
//                       onChange={(e) => handleChange("x", e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <Label>Linkedin</Label>

//                     <Input
//                       type="text"
//                       value={formData.linkedin}
//                       onChange={(e) => handleChange("linkedin", e.target.value)}
//                     />
//                   </div>

//                   <div>
//                     <Label>Instagram</Label>

//                     <Input
//                       type="text"
//                       value={formData.instagram}
//                       onChange={(e) => handleChange("instagram", e.target.value)}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-7">
//                 <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
//                   Personal Information
//                 </h5>

//                 <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
//                   <div className="col-span-2 lg:col-span-1">
//                     <Label>First Name</Label>

//                     <Input
//                       type="text"
//                       value={formData.firstName}
//                       onChange={(e) => handleChange("firstName", e.target.value)}
//                     />
//                   </div>

//                   <div className="col-span-2 lg:col-span-1">
//                     <Label>Last Name</Label>

//                     <Input
//                       type="text"
//                       value={formData.lastName}
//                       onChange={(e) => handleChange("lastName", e.target.value)}
//                     />
//                   </div>

//                   <div className="col-span-2 lg:col-span-1">
//                     <Label>Email Address</Label>

//                     <Input
//                       type="email"
//                       value={formData.email}
//                       onChange={(e) => handleChange("email", e.target.value)}
//                     />
//                   </div>

//                   <div className="col-span-2 lg:col-span-1">
//                     <Label>Phone</Label>

//                     <Input
//                       type="text"
//                       value={formData.phone}
//                       onChange={(e) => handleChange("phone", e.target.value)}
//                     />
//                   </div>

//                   <div className="col-span-2">
//                     <Label>Bio</Label>

//                     <Input
//                       type="text"
//                       value={formData.bio}
//                       onChange={(e) => handleChange("bio", e.target.value)}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
//               <Button type="button" size="sm" variant="outline" onClick={closeModal}>
//                 Close
//               </Button>

//               <Button type="submit" size="sm" disabled={loading}>
//                 {loading ? "Saving..." : "Save Changes"}
//               </Button>
//             </div>
//           </form>
//         </div>
//       </Modal>
//     </>
//   );
// }
