"""
Run the full synthetic dataset pipeline.
Usage:
    python run.py          # Run all steps
    python run.py 1        # Run step 1 only (structure)
    python run.py 2        # Run step 2 only (documents)
    python run.py 3        # Run step 3 only (benchmark)
    python run.py 1 2      # Run steps 1 and 2
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))


def run_step1():
    from generate_structure import main as step1
    step1()


def run_step2():
    from generate_documents import main as step2
    step2()


def run_step3():
    from generate_benchmark import main as step3
    step3()


STEPS = {
    1: ("Structure (metadata + graph)", run_step1),
    2: ("Documents (LLM generation)", run_step2),
    3: ("Benchmark Q&A (LLM generation)", run_step3),
}


def main():
    args = sys.argv[1:]
    if args:
        steps_to_run = [int(a) for a in args]
    else:
        steps_to_run = [1, 2, 3]

    print("=" * 60)
    print("Synthetic Banking Dataset Generator")
    print("=" * 60)
    print(f"Steps to run: {steps_to_run}\n")

    start = time.time()

    for step_num in steps_to_run:
        name, func = STEPS[step_num]
        print(f"\n{'─' * 60}")
        print(f"STEP {step_num}: {name}")
        print(f"{'─' * 60}")
        func()

    elapsed = time.time() - start
    print(f"\n{'=' * 60}")
    print(f"All done in {elapsed:.1f}s")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
