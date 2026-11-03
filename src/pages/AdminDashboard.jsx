import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Coffee,
  LayoutDashboard,
  Users,
  Search,
  Trash2,
  Eye,
  LogOut,
  Menu,
  X,
  UserCircle,
  Mail,
  MapPin,
  CalendarDays,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";

const USERS_KEY = "cafemate-demo-users";
const SESSION_KEY = "cafemate-session";

export default function AdminDashboard({ onLogout }) {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [session, setSession] = useState(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  // Load users from localStorage
  function loadData() {
    try {
      const storedUsers = JSON.parse(
        localStorage.getItem(USERS_KEY) || "[]"
      );

      const storedSession = JSON.parse(
        localStorage.getItem(SESSION_KEY) || "null"
      );

      setUsers(Array.isArray(storedUsers) ? storedUsers : []);
      setSession(storedSession);
    } catch (error) {
      console.error("Unable to load dashboard data:", error);
      setUsers([]);
      setSession(null);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Search users
  const filteredUsers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return users;

    return users.filter((user) =>
      [
        user.displayName,
        user.username,
        user.email,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [users, search]);

  // Count profiles available
  const profileCount = users.filter((user) => {
    try {
      return Boolean(
        localStorage.getItem(`cafemate-profile-${user.id}`)
      );
    } catch {
      return false;
    }
  }).length;

  // Delete a user
  function handleDelete(user) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.displayName || user.username}?`
    );

    if (!confirmed) return;

    try {
      if (user.role === "admin" && session?.id === user.id) {
        alert("You cannot delete the currently signed-in admin account.");
        return;
      }

      const updatedUsers = users.filter(
        (item) => item.id !== user.id
      );

      localStorage.setItem(
        USERS_KEY,
        JSON.stringify(updatedUsers)
      );

      // Delete the user's profile
      localStorage.removeItem(
        `cafemate-profile-${user.id}`
      );

      // Clear session if this is the currently logged-in account
      if (session?.id === user.id) {
        localStorage.removeItem(SESSION_KEY);
        setSession(null);
      }

      setUsers(updatedUsers);
      setSelectedUser(null);
    } catch (error) {
      console.error("Unable to delete user:", error);
      alert("Unable to delete this user.");
    }
  }

  // Admin logout
  function handleLogout() {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem(SESSION_KEY);
    }

    navigate("/login", { replace: true });
  }

  const navigation = [
    {
      id: "overview",
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
    },
  ];

  const cardClass =
    "rounded-2xl border border-[#E8DED5] bg-white p-5 shadow-sm";

  return (
    <div className="min-h-screen bg-[#FBF6F1] text-[#38291F]">

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#E8DED5] bg-white px-5 py-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <Coffee size={28} className="text-[#6F4E3A]" />
          <span className="text-xl font-black text-[#593722]">
            CafeMate.
          </span>
        </Link>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-lg p-2 text-[#593722]"
          aria-label="Toggle menu"
        >
          {mobileMenu ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[#E8DED5] bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${
            mobileMenu ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 border-b border-[#E8DED5] px-7 py-7">
            <Coffee size={38} className="text-[#6F4E3A]" />

            <div>
              <h1 className="text-2xl font-black text-[#593722]">
                CafeMate.
              </h1>
              <p className="text-[10px] font-bold tracking-[0.3em] text-[#8B7B70]">
                MANDALAY
              </p>
            </div>
          </div>

          {/* Admin Profile */}
          <div className="mx-5 mt-6 rounded-2xl bg-[#FBF6F1] p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#6F4E3A] text-white">
                <ShieldCheck size={23} />
              </div>

              <div className="min-w-0">
                <p className="font-bold text-[#593722]">
                  Administrator
                </p>
                <p className="truncate text-xs text-[#8B7B70]">
                  Admin Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-5">
            <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-[#A18D7E]">
              Main Menu
            </p>

            <div className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenu(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition ${
                      isActive
                        ? "bg-[#6F4E3A] text-white shadow-sm"
                        : "text-[#705D50] hover:bg-[#FBF6F1]"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Sidebar Bottom */}
          <div className="border-t border-[#E8DED5] p-5">
            <Link
              to="/"
              className="mb-3 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[#705D50] hover:bg-[#FBF6F1]"
            >
              <Coffee size={19} />
              Back to Website
            </Link>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut size={19} />
              Log Out
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenu && (
          <button
            className="fixed inset-0 z-30 bg-black/30 lg:hidden"
            onClick={() => setMobileMenu(false)}
            aria-label="Close menu"
          />
        )}

        {/* Main Content */}
        <main className="min-w-0 flex-1">

          {/* Top Navigation */}
          <header className="hidden items-center justify-between border-b border-[#E8DED5] bg-white px-8 py-5 lg:flex">
            <div>
              <h2 className="text-xl font-black text-[#593722]">
                Admin Dashboard
              </h2>
              <p className="mt-1 text-sm text-[#8B7B70]">
                Manage your CafeMate platform.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={loadData}
                className="flex items-center gap-2 rounded-xl border border-[#E8DED5] px-4 py-2.5 text-sm font-bold text-[#6F4E3A] hover:bg-[#FBF6F1]"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

              <div className="flex items-center gap-3 border-l border-[#E8DED5] pl-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-[#FBF6F1] text-[#6F4E3A]">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#593722]">
                    Administrator
                  </p>
                  <p className="text-xs text-[#8B7B70]">
                    System Manager
                  </p>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-7 lg:p-9">

            {/* Page Heading */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-[#A18D7E]">
                  CAFEMATE / ADMIN
                </p>

                <h1 className="mt-2 text-3xl font-black text-[#38291F] sm:text-4xl">
                  {activeTab === "overview"
                    ? "Overview"
                    : "User Management"}
                </h1>

                <p className="mt-2 text-sm text-[#8B7B70]">
                  Welcome to your CafeMate management panel.
                </p>
              </div>

              <button
                onClick={loadData}
                className="flex items-center gap-2 rounded-xl border border-[#E8DED5] bg-white px-4 py-3 text-sm font-bold text-[#6F4E3A] hover:bg-[#FBF6F1] lg:hidden"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
              <>
                {/* Statistics */}
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                  <div className={cardClass}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#8B7B70]">
                          Total Registered Users
                        </p>

                        <h3 className="mt-3 text-4xl font-black text-[#593722]">
                          {users.length}
                        </h3>
                      </div>

                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FBF0E6] text-[#6F4E3A]">
                        <Users size={26} />
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-[#A18D7E]">
                      All registered CafeMate accounts
                    </p>
                  </div>

                  <div className={cardClass}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#8B7B70]">
                          Profiles Created
                        </p>

                        <h3 className="mt-3 text-4xl font-black text-[#593722]">
                          {profileCount}
                        </h3>
                      </div>

                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#F0F4EA] text-[#64794E]">
                        <UserCircle size={26} />
                      </div>
                    </div>

                    <p className="mt-4 text-xs text-[#A18D7E]">
                      Accounts with saved profiles
                    </p>
                  </div>

                  <div className={cardClass}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#8B7B70]">
                          Current Session
                        </p>

                        <h3 className="mt-3 text-2xl font-black text-[#593722]">
                          {session ? "Logged In" : "No Session"}
                        </h3>
                      </div>

                      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#EDF4EC] text-[#64794E]">
                        <ShieldCheck size={26} />
                      </div>
                    </div>

                    <p className="mt-4 truncate text-xs text-[#A18D7E]">
                      {session?.email || "No active account"}
                    </p>
                  </div>
                </div>

                {/* Recent Users */}
                <section className={`${cardClass} mt-7`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-black text-[#593722]">
                        Registered Users
                      </h2>
                      <p className="mt-1 text-sm text-[#8B7B70]">
                        Recently stored accounts.
                      </p>
                    </div>

                    <button
                      onClick={() => setActiveTab("users")}
                      className="rounded-xl bg-[#6F4E3A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#593722]"
                    >
                      View All Users
                    </button>
                  </div>

                  <UserTable
                    users={users.slice(-5).reverse()}
                    onView={setSelectedUser}
                    onDelete={handleDelete}
                  />
                </section>

                {/* Quick Information */}
                <section className="mt-7 rounded-2xl bg-[#6F4E3A] p-6 text-white">
                  <div className="flex items-start gap-4">
                    <Coffee size={30} />

                    <div>
                      <h2 className="text-xl font-black">
                        Welcome to CafeMate Admin
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
                        Manage registered accounts and monitor the basic
                        information stored in your CafeMate application.
                      </p>
                    </div>
                  </div>
                </section>
              </>
            )}

            {/* USER MANAGEMENT */}
            {activeTab === "users" && (
              <section className={cardClass}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-[#593722]">
                      All Registered Users
                    </h2>

                    <p className="mt-1 text-sm text-[#8B7B70]">
                      {users.length} registered account(s)
                    </p>
                  </div>

                  <button
                    onClick={loadData}
                    className="rounded-xl border border-[#E8DED5] p-3 text-[#6F4E3A] hover:bg-[#FBF6F1]"
                    aria-label="Refresh users"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>

                {/* Search */}
                <div className="relative mt-6">
                  <Search
                    size={19}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A18D7E]"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, username, or email..."
                    className="w-full rounded-xl border border-[#E8DED5] bg-[#FBF6F1] py-3.5 pl-12 pr-4 text-sm text-[#593722] outline-none focus:border-[#6F4E3A]"
                  />
                </div>

                {/* User Table */}
                <UserTable
                  users={filteredUsers}
                  onView={setSelectedUser}
                  onDelete={handleDelete}
                />

                {filteredUsers.length === 0 && (
                  <div className="py-12 text-center">
                    <Users
                      size={40}
                      className="mx-auto text-[#C8B7AA]"
                    />

                    <p className="mt-3 font-bold text-[#593722]">
                      No users found
                    </p>

                    <p className="mt-1 text-sm text-[#8B7B70]">
                      Try another search keyword.
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Footer */}
          <footer className="border-t border-[#E8DED5] bg-white px-6 py-5 text-center text-xs text-[#A18D7E]">
            © {new Date().getFullYear()} CafeMate Mandalay. Admin Dashboard.
          </footer>
        </main>
      </div>

      {/* USER DETAILS MODAL */}
      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}


// ==========================================
// USER TABLE COMPONENT
// ==========================================

function UserTable({ users, onView, onDelete }) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[650px] text-left">
        <thead>
          <tr className="border-b border-[#E8DED5] text-xs uppercase tracking-wider text-[#A18D7E]">
            <th className="px-4 py-4">User</th>
            <th className="px-4 py-4">Username</th>
            <th className="px-4 py-4">Email</th>
            <th className="px-4 py-4">Role</th>
            <th className="px-4 py-4 text-center">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-[#F1EAE4] transition hover:bg-[#FBF6F1]"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F3E7DC] font-bold text-[#6F4E3A]">
                    {(user.displayName || user.username || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span className="font-bold text-[#593722]">
                    {user.displayName || "Unnamed User"}
                  </span>
                </div>
              </td>

              <td className="px-4 py-4 text-sm text-[#705D50]">
                @{user.username || "unknown"}
              </td>

              <td className="px-4 py-4 text-sm text-[#705D50]">
                {user.email}
              </td>

              {/* Role Column */}
              <td className="px-4 py-4">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    user.role === "admin"
                      ? "bg-blue-50 text-blue-700"
                      : "bg-[#FBF6F1] text-[#705D50]"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "User"}
                </span>
              </td>

              <td className="px-4 py-4">
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => onView(user)}
                    className="rounded-lg bg-[#F3E7DC] p-2 text-[#6F4E3A] hover:bg-[#EBD7C5]"
                    title="View user"
                  >
                    <Eye size={17} />
                  </button>

                  <button
                    onClick={() => onDelete(user)}
                    className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100"
                    title="Delete user"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


// ==========================================
// USER DETAILS MODAL
// ==========================================

function UserDetailsModal({ user, onClose, onDelete }) {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(
        `cafemate-profile-${user.id}`
      );

      setProfile(
        savedProfile ? JSON.parse(savedProfile) : null
      );
    } catch {
      setProfile(null);
    }
  }, [user.id]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-[#593722]">
            User Details
          </h2>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-[#8B7B70] hover:bg-[#FBF6F1]"
            aria-label="Close"
          >
            <X size={21} />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center rounded-2xl bg-[#FBF6F1] p-6">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-[#6F4E3A] text-3xl font-black text-white">
            {(user.displayName || user.username || "U")
              .charAt(0)
              .toUpperCase()}
          </div>

          <h3 className="mt-4 text-xl font-black text-[#593722]">
            {user.displayName || "Unnamed User"}
          </h3>

          <p className="mt-1 text-sm text-[#8B7B70]">
            @{user.username}
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <DetailRow
            icon={Mail}
            label="Email Address"
            value={user.email}
          />

          <DetailRow
            icon={UserCircle}
            label="Display Name"
            value={profile?.displayName || user.displayName || "Not set"}
          />

          <DetailRow
            icon={MapPin}
            label="Location"
            value={profile?.location || "Not set"}
          />

          <DetailRow
            icon={CalendarDays}
            label="Bio"
            value={profile?.bio || "No bio available"}
          />

          <DetailRow
            icon={ShieldCheck}
            label="Account ID"
            value={user.id}
          />
        </div>

        <button
          onClick={() => onDelete(user)}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3.5 font-bold text-red-600 hover:bg-red-100"
        >
          <Trash2 size={18} />
          Delete User
        </button>
      </div>
    </div>
  );
}


// ==========================================
// DETAIL ROW COMPONENT
// ==========================================

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-[#FBF6F1] p-2 text-[#6F4E3A]">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-[#A18D7E]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold text-[#593722]">
          {value}
        </p>
      </div>
    </div>
  );
}