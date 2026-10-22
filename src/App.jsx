import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Account from './pages/Account'
import Discover from './pages/Discover'
import Favorites from './pages/Favorites'
import Random from './pages/Random'
import Search from './pages/Search'
import SignIn from './pages/SignIn'
import Topic from './pages/Topic'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Discover />} />
        <Route path="search" element={<Search />} />
        <Route path="topic/:title" element={<Topic />} />
        <Route path="random" element={<Random />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="signin" element={<SignIn />} />
        <Route path="account" element={<Account />} />
        <Route path="*" element={<div className="container page"><h1 className="serif">Nothing here yet.</h1></div>} />
      </Route>
    </Routes>
  )
}
