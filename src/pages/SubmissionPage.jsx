import React, { useState, useEffect } from 'react';
import apiClient from '../api/axios';
import Header from '../components/Header';
import Modal from '../components/Modal'; // 재사용 가능한 모달 컴포넌트
import './SubmissionPage.css';

function SubmissionPage() {
    // 폼 입력 값을 위한 state
    const [teamNum, setTeamNum] = useState('');
    const [material, setMaterial] = useState('');

    // API로부터 받아올 재질 목록을 저장할 state
    const [materialOptions, setMaterialOptions] = useState([]);

    // 제출 과정 및 결과 피드백을 위한 state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // 성공 팝업(모달) 관리를 위한 state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [completedOrderId, setCompletedOrderId] = useState(null);

    // 컴포넌트가 처음 렌더링될 때 재질 목록을 API로부터 가져옵니다.
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                // API 명세서에 명시된 재질 목록 GET 엔드포인트
                const response = await apiClient.get('/register/getmaterial');
                const materials = response.data;

                setMaterialOptions(materials);

                // 재질 목록을 성공적으로 불러오면, 첫 번째 항목을 기본 선택값으로 설정
                if (materials && materials.length > 0) {
                    setMaterial(materials[0]);
                }
            } catch (err) {
                console.error("재질 목록을 불러오는 데 실패했습니다:", err);
                setErrorMessage("재질 목록을 불러오는 데 실패했습니다. 페이지를 새로고침해주세요.");
            }
        };

        fetchMaterials();
    }, []); // 빈 배열을 전달하여 최초 렌더링 시에만 실행되도록 함

    // 폼 제출 시 실행될 함수
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamNum.trim()) {
            alert('팀명을 입력해주세요.');
            return;
        }
        if (!material) {
            alert('재질을 선택해주세요.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const payload = { teamNum, material };
            const response = await apiClient.post('/register', payload);
            const { orderId } = response.data;

            setCompletedOrderId(orderId ?? '확인불가');
            setIsModalOpen(true);
            setTeamNum('');
        } catch (err) {
            console.error('접수 에러:', err);
            setErrorMessage('주문 접수에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // 모달을 닫는 함수
    const closeModal = () => {
        setIsModalOpen(false);
        setCompletedOrderId(null);
    }

    return (
        <div className="page-container">
            <Header />
            <div className="main-content-area">
                <div className="submission-card">
                    <h1 className="page-title">접수 페이지</h1>
                    <form onSubmit={handleSubmit} className="submission-form">

                        {/* 팀명 입력 필드 */}
                        <div className="form-group">
                            <label htmlFor="team-input">팀명</label>
                            <input
                                id="team-input"
                                type="text"
                                value={teamNum}
                                onChange={(e) => setTeamNum(e.target.value)}
                                placeholder="팀명을 입력해주세요"
                            />
                        </div>

                        {/* 재질 선택 드롭다운 */}
                        <div className="form-group">
                            <label htmlFor="material-select">재질</label>
                            <select
                                id="material-select"
                                value={material}
                                onChange={(e) => setMaterial(e.target.value)}
                                disabled={materialOptions.length === 0} // 목록 로딩 중 비활성화
                            >
                                {materialOptions.length === 0 ? (
                                    <option>불러오는 중...</option>
                                ) : (
                                    materialOptions.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>

                        <button type="submit" className="submit-button" disabled={isSubmitting}>
                            {isSubmitting ? '제출 중...' : '제출'}
                        </button>
                    </form>

                    {/* 에러 메시지 표시 영역 */}
                    {errorMessage && <p className="feedback-message error">{errorMessage}</p>}
                </div>
            </div>

            {/* 접수 성공 시 나타나는 모달 */}
            <Modal isOpen={isModalOpen} onClose={closeModal}>
                <h2 className="modal-title">접수 완료</h2>
                <p className="modal-message">
                    접수번호는 <strong className="highlight-id">{completedOrderId}</strong>번입니다.
                </p>
                <p className="modal-message">
                    접수대로 이동하여 주문을 완료하여 주세요. 
                </p>
            </Modal>
        </div>
    );
}

export default SubmissionPage;
