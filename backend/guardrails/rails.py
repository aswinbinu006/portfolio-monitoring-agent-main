"""
Input and output guardrails for portfolio monitoring agents.

Input Rails: Block inappropriate requests
Output Rails: Validate generated content
"""
import re
from typing import Dict, List, Tuple


class InputRails:
    """
    Input validation and filtering.
    
    Blocks:
    - Buy/sell advice requests
    - Off-topic queries
    - Manipulation attempts
    """
    
    # Patterns that indicate buy/sell advice requests
    BUY_SELL_PATTERNS = [
        r'\b(should\s+i|shall\s+i|can\s+i)\s+(buy|sell|purchase|trade)\b',
        r'\b(recommend|suggest|advise).*(buy|sell|purchase)\b',
        r'\bwhat\s+to\s+(buy|sell)\b',
        r'\b(buy|sell)\s+recommendation\b',
        r'\btrade\s+advice\b',
        r'\binvestment\s+advice\b',
        r'\b(long|short)\s+position\b',
        r'\bentry\s+point\b',
        r'\bexit\s+point\b',
    ]
    
    # Off-topic patterns
    OFF_TOPIC_PATTERNS = [
        r'\b(weather|sports|politics|news)\b',
        r'\b(recipe|cooking|food)\b',
        r'\b(movie|film|music)\b',
        r'\bhow\s+to\s+(make|cook|build)\b',
        r'\b(joke|funny|story)\b',
    ]
    
    def __init__(self):
        self.compiled_buy_sell = [re.compile(p, re.IGNORECASE) for p in self.BUY_SELL_PATTERNS]
        self.compiled_off_topic = [re.compile(p, re.IGNORECASE) for p in self.OFF_TOPIC_PATTERNS]
    
    def validate(self, user_input: str) -> Tuple[bool, Optional[str]]:
        """
        Validate user input.
        
        Args:
            user_input: User's query or request
        
        Returns:
            Tuple of (is_valid, rejection_reason)
        """
        # Check for buy/sell advice requests
        for pattern in self.compiled_buy_sell:
            if pattern.search(user_input):
                return False, "I cannot provide buy or sell recommendations. This system is for monitoring and explanation only."
        
        # Check for off-topic queries
        for pattern in self.compiled_off_topic:
            if pattern.search(user_input):
                return False, "This query appears to be off-topic. I focus on portfolio monitoring and risk analysis."
        
        # Check length (prevent very long inputs)
        if len(user_input) > 5000:
            return False, "Input too long. Please keep queries under 5000 characters."
        
        return True, None


class OutputRails:
    """
    Output validation and fact-checking.
    
    Blocks:
    - Directive language (buy/sell commands)
    - Uncited claims
    - Fabricated numbers
    """
    
    # Directive patterns that should never appear in output
    DIRECTIVE_PATTERNS = [
        r'\b(you\s+should|must|need\s+to)\s+(buy|sell|purchase|trade)\b',
        r'\b(i\s+recommend|i\s+suggest|i\s+advise).*(buy|sell)\b',
        r'\b(buy|sell)\s+(immediately|now|today)\b',
        r'\b(take\s+profit|cut\s+losses)\b',
        r'\b(strong\s+buy|strong\s+sell)\b',
    ]
    
    # Suspicious claim patterns
    SUSPICIOUS_PATTERNS = [
        r'\bguaranteed\s+returns?\b',
        r'\brisk[-\s]?free\b',
        r'\b(always|never)\s+(profit|lose)\b',
        r'\b100%\s+(sure|certain)\b',
    ]
    
    def __init__(self):
        self.compiled_directives = [re.compile(p, re.IGNORECASE) for p in self.DIRECTIVE_PATTERNS]
        self.compiled_suspicious = [re.compile(p, re.IGNORECASE) for p in self.SUSPICIOUS_PATTERNS]
    
    def validate(
        self,
        output_text: str,
        computed_metrics: Optional[Dict] = None
    ) -> Tuple[bool, List[str]]:
        """
        Validate agent output.
        
        Args:
            output_text: Generated text to validate
            computed_metrics: Dict of computed metrics for fact-checking
        
        Returns:
            Tuple of (is_valid, list_of_violations)
        """
        violations = []
        
        # Check for directive language
        for pattern in self.compiled_directives:
            if pattern.search(output_text):
                violations.append(f"Contains directive language: {pattern.pattern}")
        
        # Check for suspicious claims
        for pattern in self.compiled_suspicious:
            if pattern.search(output_text):
                violations.append(f"Contains suspicious claim: {pattern.pattern}")
        
        # Check for uncited news claims
        if self._has_uncited_news_claims(output_text):
            violations.append("Contains news claims without citations")
        
        # Cross-check numbers if metrics provided
        if computed_metrics:
            number_violations = self._validate_numbers(output_text, computed_metrics)
            violations.extend(number_violations)
        
        return len(violations) == 0, violations
    
    def _has_uncited_news_claims(self, text: str) -> bool:
        """Check if text makes news claims without citations."""
        # Patterns indicating news claims
        news_indicators = [
            r'\baccording\s+to\b',
            r'\breported\s+by\b',
            r'\bannounced\s+that\b',
            r'\bpress\s+release\b',
        ]
        
        # Citation indicators
        citation_indicators = [
            r'http[s]?://',
            r'\[\d+\]',  # Reference numbers
            r'Source:',
            r'Published:',
        ]
        
        has_news = any(re.search(p, text, re.IGNORECASE) for p in news_indicators)
        has_citation = any(re.search(p, text, re.IGNORECASE) for p in citation_indicators)
        
        # If has news claim but no citation, that's a violation
        return has_news and not has_citation
    
    def _validate_numbers(
        self,
        text: str,
        computed_metrics: Dict
    ) -> List[str]:
        """Validate that numbers in text match computed metrics."""
        violations = []
        
        # Extract percentage values from text
        percentages = re.findall(r'(\d+\.?\d*)\s*%', text)
        
        # For each metric, check if text contains contradictory values
        metrics_to_check = {
            'volatility': computed_metrics.get('annualized_volatility'),
            'sharpe': computed_metrics.get('sharpe_ratio'),
            'max_drawdown': computed_metrics.get('max_drawdown'),
        }
        
        for metric_name, true_value in metrics_to_check.items():
            if true_value is None:
                continue
            
            # Search for this metric in text
            if metric_name.lower() in text.lower():
                # Extract nearby numbers
                pattern = rf'{metric_name}[:\s]+(\d+\.?\d*)'
                matches = re.findall(pattern, text, re.IGNORECASE)
                
                for match in matches:
                    text_value = float(match)
                    
                    # Allow 5% tolerance for rounding
                    if metric_name == 'max_drawdown':
                        tolerance = abs(true_value * 0.05)
                    else:
                        tolerance = abs(true_value * 0.05)
                    
                    if abs(text_value - abs(true_value)) > tolerance:
                        violations.append(
                            f"{metric_name}: text has {text_value}, computed is {true_value:.4f}"
                        )
        
        return violations


class GuardrailSystem:
    """Combined input and output guardrails."""
    
    def __init__(self):
        self.input_rails = InputRails()
        self.output_rails = OutputRails()
    
    def validate_input(self, user_input: str) -> Tuple[bool, Optional[str]]:
        """Validate user input."""
        return self.input_rails.validate(user_input)
    
    def validate_output(
        self,
        output_text: str,
        computed_metrics: Optional[Dict] = None
    ) -> Tuple[bool, List[str]]:
        """Validate agent output."""
        return self.output_rails.validate(output_text, computed_metrics)
    
    def filter_and_process(
        self,
        user_input: str,
        agent_output: str,
        computed_metrics: Optional[Dict] = None
    ) -> Dict:
        """
        Run both input and output validation.
        
        Returns:
            Dict with validation results
        """
        # Validate input
        input_valid, input_reason = self.validate_input(user_input)
        
        if not input_valid:
            return {
                "status": "rejected_input",
                "reason": input_reason,
                "user_input": user_input
            }
        
        # Validate output
        output_valid, output_violations = self.validate_output(
            agent_output,
            computed_metrics
        )
        
        if not output_valid:
            return {
                "status": "rejected_output",
                "violations": output_violations,
                "output_text": agent_output
            }
        
        return {
            "status": "passed",
            "user_input": user_input,
            "agent_output": agent_output
        }


if __name__ == "__main__":
    print("Guardrails System Demo")
    print("=" * 60)
    
    guardrails = GuardrailSystem()
    
    # Test input rails
    print("\n[Input Rails Tests]")
    
    test_inputs = [
        "Should I buy RELIANCE stock?",  # Should reject
        "What's the volatility of my portfolio?",  # Should pass
        "Tell me a joke",  # Should reject (off-topic)
        "Explain the recent drop in TCS.NS"  # Should pass
    ]
    
    for inp in test_inputs:
        valid, reason = guardrails.validate_input(inp)
        status = "✓ PASS" if valid else "✗ REJECT"
        print(f"{status}: {inp}")
        if reason:
            print(f"  Reason: {reason}")
    
    # Test output rails
    print("\n[Output Rails Tests]")
    
    test_outputs = [
        "You should buy this stock immediately",  # Should reject
        "The portfolio shows 15% volatility with Sharpe ratio of 1.5",  # Should pass
        "According to recent news, the stock dropped",  # Should reject (uncited)
        "According to Reuters (https://...), the stock dropped"  # Should pass (cited)
    ]
    
    for out in test_outputs:
        valid, violations = guardrails.validate_output(out)
        status = "✓ PASS" if valid else "✗ REJECT"
        print(f"{status}: {out[:50]}...")
        if violations:
            print(f"  Violations: {', '.join(violations)}")
