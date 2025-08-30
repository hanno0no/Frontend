// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // a 태그 대신 Link를 사용합니다.
import './Header.css';

function Header() {
    // 드롭다운 메뉴의 열림/닫힘 상태를 관리하는 state
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // HNN 로고를 클릭했을 때 호출될 함수
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen); // 현재 상태의 반대값으로 변경
    };

    return (
        <header className="header-container">
            <div className="logo-section">
                {/* 로고를 클릭하면 드롭다운 상태가 토글됩니다. */}
                <h1 onClick={toggleDropdown} className="logo-title">
                    HNN
                </h1>

                {/* isDropdownOpen이 true일 때만 드롭다운 메뉴를 보여줍니다. */}
                {isDropdownOpen && (
                    <nav className="dropdown-menu">
                        <ul>
                            <li>
                                {/* Link 컴포넌트로 페이지를 이동합니다. 페이지 전체가 새로고침되지 않습니다. */}
                                <Link to="/" onClick={() => setIsDropdownOpen(false)}>HNN</Link>
                            </li>
                            <li>
                                {/* Link 컴포넌트로 페이지를 이동합니다. 페이지 전체가 새로고침되지 않습니다. */}
                                <Link to="/submission" onClick={() => setIsDropdownOpen(false)}>접수 신청</Link>
                            </li>
                            <li>
                                {/* Link 컴포넌트로 페이지를 이동합니다. 페이지 전체가 새로고침되지 않습니다. */}
                                <Link to="/team-lookup" onClick={() => setIsDropdownOpen(false)}>팀별 조회</Link>
                            </li>
                            <li>
                                <Link to="/admin" onClick={() => setIsDropdownOpen(false)}>LOGIN</Link>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
}

export default Header;