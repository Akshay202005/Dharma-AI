import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

const PasswordInput = ({ id, placeholder, value, onChange, autoComplete }) => {
  const [show, setShow] = useState(false); // each field keeps its own show/hide state

  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required
        className="w-full px-3 py-2 pr-10 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
        onClick={() => setShow((prev) => !prev)}
      >
        {show ? <FaRegEyeSlash /> : <FaRegEye />}
      </button>
    </div>
  );
};

export default PasswordInput;