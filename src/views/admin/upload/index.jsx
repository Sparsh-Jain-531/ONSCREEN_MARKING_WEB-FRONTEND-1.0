import { useEffect, useState, useRef } from "react";
import { FaCloudUploadAlt, FaArrowAltCircleDown } from "react-icons/fa";
import Papa from "papaparse";
import routes from "routes";
import { toast } from "react-toastify";
import { getAllUsers } from "services/common";
import axios from "axios";

const Upload = () => {
  const [selectedRole, setSelectedRole] = useState(null); // Default value
  const [file, setFile] = useState({ name: "No file chosen" });
  const [disabled, setDisabled] = useState(true); // Start with disabled true
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false); // Loading state for the file upload
  const [refinedData, setRefinedData] = useState(null);
  const csvLinkRef = useRef(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getAllUsers();
        setUsers(response); // Assuming 'response' contains an array of user objects with 'email' field
      } catch (error) {
        console.log(error);
      }
    };
    fetchUsers();
  }, [token]);

  const handleChange = (event) => {
    const role = event.target.value;
    setSelectedRole(role); // Update state with selected value

    // Enable button only if a valid role is selected
    setDisabled(role === "null");
  };

  const downloadSampleCsv = () => {
    // Define the CSV headings
    const csvHeadings = ["Name", "Mobile", "Email", "Password"];

    // Convert the headings to CSV format (comma-separated and new line at the end)
    const csvContent = csvHeadings.join(",") + "\n";

    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: "text/csv" });
    csvLinkRef.current.href = URL.createObjectURL(blob);
    csvLinkRef.current.click(); // Trigger the download
  };

  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function (result) {
          resolve(result.data);
        },
        error: function (error) {
          reject(error);
        },
      });
    });
  };

  const uploadHandle = async (e) => {
    if (!selectedRole || selectedRole === "null") {
      toast.warning("Please select a role");
      return;
    }

    try {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);

      if (!selectedFile) {
        setDisabled(false);
        return;
      }

      const jsonData = await parseCSV(selectedFile);

      // Modify the data to add roles and permissions...
      const modifiedData = jsonData.map((row) => ({
        ...row,
        role: selectedRole,
        permissions:
          selectedRole === "admin"
            ? routes.map((route) => route.name)
            : routes
              .filter(
                (route) =>
                  route.name === "Main Dashboard" || route.name === "Profile"
              )
              .map((route) => route.name),
      }));

      // Check for duplicate emails
      const duplicateEmails = modifiedData.filter((row) =>
        users.some((user) => user.email === row.Email)
      );

      if (duplicateEmails.length > 0) {
        duplicateEmails.forEach((row) => {
          toast.warning(`Duplicate email: ${row.Email}`);
        });
        return;
      }

      setRefinedData(modifiedData);
    } catch (error) {
      toast.error("Error processing the file");
    }
  };

  const sendData = async (data) => {
    setLoading(true); // Start loading indicator
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/createuserbycsv`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response;
    } catch (error) {
      console.error(error);
      return error;
    } finally {
      setLoading(false); // End loading indicator
      setSelectedRole(null);
      setFile({ name: "No file chosen" });
    }
  };

  const handleSubmit = async () => {
    if (!refinedData || refinedData.length === 0 || !selectedRole) {
      toast.warning("Please upload a valid CSV file");
      return;
    }

    try {
      const response = await sendData(refinedData);

      if (response?.data?.message) {
        toast.success(response.data.message);
      } else {
        toast.warning("Unexpected response format");
      }
    } catch (error) {
      console.error("Error:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("An error occurred. Please try again.");
      }
    }
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 py-4">
      <article className="cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow-lg transition duration-300 ease-in-out hover:shadow-xl hover:border-blue-500">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Upload CSV File</h3>
          <p className="text-md text-gray-500">User Creation</p>
        </div>

        <div className="flex justify-between items-center">
          <div
            className="text-md group mt-4 inline-flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700 transition-all"
            onClick={downloadSampleCsv}
          >
            <span>Download Sample</span>
            <FaArrowAltCircleDown className="m-1 text-lg" />
          </div>

          <div className="mt-4 inline-flex items-center gap-2">
            <label
              className="text-md group inline-flex cursor-pointer items-center gap-1 font-medium text-blue-600 hover:text-blue-700 transition-all"
              onClick={() => disabled && toast.warning("Please select a role")}
            >
              Upload CSV
              <input
                type="file"
                className="hidden"
                disabled={disabled}
                accept=".csv"
                onChange={uploadHandle}
              />
              <FaCloudUploadAlt className="m-1 text-2xl" />
            </label>
            <span className="max-w-xs overflow-hidden text-ellipsis">
              {file.name}
            </span>
          </div>
        </div>

        {loading && <div className="mt-4 text-blue-600">Uploading...</div>}
      </article>

      <div className="flex flex-col space-y-2">
        <label htmlFor="userRole" className="text-lg font-medium text-gray-700">
          Select Role
        </label>
        <select
          id="userRole"
          value={selectedRole}
          onChange={handleChange}
          className="rounded-lg border border-gray-300 p-3 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        >
          <option value="null">Select Role</option>
          <option value="admin">Admin</option>
          <option value="evaluator">Evaluator</option>
          <option value="reviewer">Reviewer</option>
        </select>

        <div
          className="hover:bg-transparent inline-block rounded border border-indigo-600 bg-indigo-600 px-12 py-3 text-sm font-medium text-white hover:text-indigo-600 hover:bg-white transition duration-300 ease-in-out focus:outline-none focus:ring active:text-indigo-500 cursor-pointer"
          onClick={handleSubmit}
        >
          Upload CSV
        </div>
      </div>

      <a ref={csvLinkRef} style={{ display: "none" }} download="sample.csv" />
    </div>
  );
};

export default Upload;
