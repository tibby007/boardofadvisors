import React from 'react';
import styled from 'styled-components';

// Styled components for the advisor card
const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin-bottom: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 16px;
`;

const Avatar = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-image: url(${props => props.src});
  background-size: cover;
  background-position: center;
  margin-right: 16px;
  border: 2px solid #f0f0f0;
`;

const AdvisorInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AdvisorName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin: 0 0 4px 0;
`;

const AdvisorDomain = styled.span`
  font-size: 14px;
  color: #666666;
  font-weight: 500;
`;

const ResponseContent = styled.div`
  font-size: 16px;
  line-height: 1.6;
  color: #333333;
  
  p:first-child {
    margin-top: 0;
  }
  
  p:last-child {
    margin-bottom: 0;
  }
`;

const Divider = styled.div`
  height: 1px;
  background-color: #f0f0f0;
  margin: 0 0 16px 0;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`;

const ActionButton = styled.button`
  background: ${props => props.primary ? '#4A6CF7' : 'transparent'};
  color: ${props => props.primary ? '#ffffff' : '#4A6CF7'};
  border: ${props => props.primary ? 'none' : '1px solid #4A6CF7'};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  margin-left: 12px;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.primary ? '#3A5CE7' : 'rgba(74, 108, 247, 0.08)'};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.3);
  }
`;

/**
 * AdvisorCard Component
 * 
 * Displays an advisor's information and their response to a question.
 * 
 * @param {Object} props
 * @param {string} props.name - Advisor's name
 * @param {string} props.domain - Advisor's domain of expertise
 * @param {string} props.avatarUrl - URL to the advisor's avatar image
 * @param {string} props.response - Advisor's response to the question
 * @param {Function} props.onRequestFollowUp - Callback when follow-up is requested
 * @param {Function} props.onShare - Callback when share is clicked
 * @returns {JSX.Element}
 */
const AdvisorCard = ({
  name,
  domain,
  avatarUrl,
  response,
  onRequestFollowUp,
  onShare
}) => {
  return (
    <CardContainer>
      <CardHeader>
        <Avatar src={avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`} />
        <AdvisorInfo>
          <AdvisorName>{name}</AdvisorName>
          <AdvisorDomain>{domain}</AdvisorDomain>
        </AdvisorInfo>
      </CardHeader>
      
      <Divider />
      
      <ResponseContent>
        {response.split('\n').map((paragraph, index) => (
          paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
        ))}
      </ResponseContent>
      
      <ActionButtons>
        {onShare && (
          <ActionButton onClick={onShare}>
            Share
          </ActionButton>
        )}
        {onRequestFollowUp && (
          <ActionButton primary onClick={onRequestFollowUp}>
            Request Follow-up
          </ActionButton>
        )}
      </ActionButtons>
    </CardContainer>
  );
};

export default AdvisorCard;
