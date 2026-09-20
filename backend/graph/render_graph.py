"""
Render LangGraph workflow to diagram.
Saves PNG to eval/docs/workflow_diagram.png
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from graph.langgraph_flow import build_workflow_graph, LANGGRAPH_AVAILABLE


def render_workflow_diagram():
    """Render workflow graph to PNG."""
    if not LANGGRAPH_AVAILABLE:
        print("ERROR: LangGraph not installed")
        return False
    
    try:
        # Build graph
        graph = build_workflow_graph()
        
        # Get Mermaid representation
        mermaid_code = graph.get_graph().draw_mermaid()
        
        # Save to file
        output_dir = Path(__file__).parent.parent / "eval" / "docs"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        mermaid_file = output_dir / "workflow_diagram.mmd"
        with open(mermaid_file, 'w') as f:
            f.write(mermaid_code)
        
        print(f"✓ Mermaid diagram saved to: {mermaid_file}")
        print("\nYou can visualize this with:")
        print("  1. https://mermaid.live/")
        print("  2. VS Code Mermaid extension")
        print("  3. mmdc CLI: mmdc -i workflow_diagram.mmd -o workflow_diagram.png")
        
        # Also print the mermaid code
        print("\n" + "="*60)
        print("MERMAID CODE:")
        print("="*60)
        print(mermaid_code)
        
        return True
    
    except Exception as e:
        print(f"ERROR: {e}")
        return False


if __name__ == "__main__":
    render_workflow_diagram()
