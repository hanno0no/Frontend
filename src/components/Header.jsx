// src/components/Header.jsx
import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Header.css';

function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user } = useContext(AuthContext);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const authPath = user ? '/admin' : '/login';

    return (
        <header className="header-container">
            <div className="logo-section">
                <h1 onClick={toggleDropdown} className="logo-title">
                    HNN
                </h1>

                {isDropdownOpen && (
                    <nav className="dropdown-menu">
                        <ul>
                            <li>
                                <Link to="/" onClick={() => setIsDropdownOpen(false)}>HNN</Link>
                            </li>
                            <li>
                                <Link to="/submission" onClick={() => setIsDropdownOpen(false)}>접수 신청</Link>
                            </li>
                            <li>
                                <Link to="/team-lookup" onClick={() => setIsDropdownOpen(false)}>팀별 조회</Link>
                            </li>
                            <li>
                                <Link to={authPath} onClick={() => setIsDropdownOpen(false)}>LOGIN</Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
}

export default Header;
