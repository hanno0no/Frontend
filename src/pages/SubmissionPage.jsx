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
                const response = await apiClient.get('/registar/getmaterial');
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
            const response = await apiClient.post('/registar', payload);

            console.log('서버 응답:', response.data); // "접수가 완료되었습니다. 접수번호: 16"

            // ✅ 핵심: 문자열에서 접수 번호만 추출하는 로직
            const responseString = response.data;
            const parts = responseString.split(':'); // ':' 문자를 기준으로 문자열을 ["...", " 16"] 배열로 나눔

            // ':' 뒷부분이 존재하는지 확인 (안전장치)
            if (parts.length > 1) {
                const orderId = parts[1].trim(); // 두 번째 부분(" 16")의 양쪽 공백을 제거하여 "16"만 남김
                setCompletedOrderId(orderId); // 추출한 번호를 state에 저장
            } else {
                // 혹시 모를 예외 상황 처리 (예: 응답 형식이 바뀐 경우)
                setCompletedOrderId('확인불가');
            }

            setIsModalOpen(true); // 모달 띄우기
            setTeamNum(''); // 성공 후 폼 초기화

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
