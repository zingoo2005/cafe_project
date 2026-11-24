import Login from './auths/login'

export default function AdminLogin({ onLogin }) {
  return <Login onLogin={onLogin} expectedRole="admin" />
}
