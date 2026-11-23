export type ConceptModuleId = 'trees' | 'binary-search';

export type CodeTemplateLang = 'python' | 'cpp' | 'c';

export interface ComplexityRow {
  operation: string;
  timeBest: string;
  timeAverage: string;
  timeWorst: string;
  space: string;
  notes: string;
}

export interface TreeNodeVisual {
  id: string;
  label: string;
  x: number;
  y: number;
  leftId?: string;
  rightId?: string;
  meta?: string; // e.g. "d=1, h=2"
}

export interface TreeDiagramStep {
  title: string;
  description: string;
  activeNodeId?: string;
  visitedNodeIds: string[];
  prunedNodeIds?: string[];
  highlightEdgeIds?: string[]; // format: "parentId-childId"
  structureLabel?: string; // e.g. "Call Stack", "BFS Queue", "Comparison"
  structureItems?: string[];
  outputSequence?: string[];
}

export interface TreeVisualConfig {
  kind: 'tree';
  mode: 'single' | 'comparison';
  nodes: TreeNodeVisual[];
  comparisonNodes?: TreeNodeVisual[]; // Used for Balanced vs Skewed comparison
  comparisonTitleLeft?: string;
  comparisonTitleRight?: string;
  comparisonMetaLeft?: string;
  comparisonMetaRight?: string;
  steps: TreeDiagramStep[];
}

export interface BinarySearchStep {
  title: string;
  description: string;
  low: number;
  mid: number;
  high: number;
  foundIndex?: number;
  eliminatedIndices: number[];
  sortedHalfRange?: [number, number]; // For rotated sorted array
  predicateStatus?: ('F' | 'T' | '?')[]; // For answer space
  formulaNote: string;
}

export interface BinarySearchVisualConfig {
  kind: 'binary-search';
  arrayValues: (number | string)[];
  targetLabel: string;
  axisCaption: string;
  isAnswerSpace?: boolean;
  steps: BinarySearchStep[];
}

export interface ConceptTopic {
  id: string;
  moduleId: ConceptModuleId;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  title: string;
  shortTitle: string;
  subtitle: string;
  summary: string;
  visual: TreeVisualConfig | BinarySearchVisualConfig;
  whenToUse: string[];
  commonPitfalls: string[];
  complexityTable: ComplexityRow[];
  codeTemplates: Record<CodeTemplateLang, string>;
  practiceFilterCategory: string;
}

export interface ConceptModule {
  id: ConceptModuleId;
  badge: string;
  title: string;
  description: string;
  topics: ConceptTopic[];
}

// ============================================================================
// PURE STEP-TRACE GENERATORS (Deterministic & Unit-Testable)
// ============================================================================

export function computeStandardBinarySearchTrace(
  arr: number[],
  target: number
): BinarySearchStep[] {
  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = arr.length - 1;
  const eliminated = new Set<number>();

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    const val = arr[mid];

    if (val === target) {
      steps.push({
        title: `Match Found at index ${mid}`,
        description: `arr[${mid}] == ${target}. Return index ${mid} immediately in O(log n) time.`,
        low,
        mid,
        high,
        foundIndex: mid,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `mid = ${low} + (${high} - ${low}) // 2 = ${mid} → arr[${mid}] = ${val} == ${target}`,
      });
      break;
    } else if (val < target) {
      steps.push({
        title: `arr[${mid}] = ${val} < ${target} → Search Right`,
        description: `Since the array is sorted, every element in [${low}..${mid}] is smaller than ${target}. Discard left half and move low = mid + 1 (${mid + 1}).`,
        low,
        mid,
        high,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `mid = ${low} + (${high} - ${low}) // 2 = ${mid} → ${val} < ${target}, next low = ${mid + 1}`,
      });
      for (let i = low; i <= mid; i++) eliminated.add(i);
      low = mid + 1;
    } else {
      steps.push({
        title: `arr[${mid}] = ${val} > ${target} → Search Left`,
        description: `Since arr[${mid}] is larger than ${target}, every element in [${mid}..${high}] is too big. Discard right half and move high = mid - 1 (${mid - 1}).`,
        low,
        mid,
        high,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `mid = ${low} + (${high} - ${low}) // 2 = ${mid} → ${val} > ${target}, next high = ${mid - 1}`,
      });
      for (let i = mid; i <= high; i++) eliminated.add(i);
      high = mid - 1;
    }
  }

  return steps;
}

export function computeLowerBoundTrace(
  arr: number[],
  target: number
): BinarySearchStep[] {
  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = arr.length; // half-open [low, high)
  const eliminated = new Set<number>();

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const val = arr[mid];

    if (val >= target) {
      steps.push({
        title: `arr[${mid}] = ${val} ≥ ${target} → Keep mid & Shrink Right`,
        description: `Index ${mid} is a valid candidate for Lower Bound, but an earlier occurrence might exist on the left. Set high = mid (${mid}) without discarding mid.`,
        low,
        mid,
        high: Math.min(high, arr.length - 1),
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `Invariant [low=${low}, high=${high}): arr[${mid}]=${val} ≥ ${target} → high = ${mid}`,
      });
      for (let i = mid + 1; i < Math.min(high, arr.length); i++) eliminated.add(i);
      high = mid;
    } else {
      steps.push({
        title: `arr[${mid}] = ${val} < ${target} → Discard Left Half`,
        description: `Index ${mid} and everything left of it is strictly less than ${target}. Safely advance low = mid + 1 (${mid + 1}).`,
        low,
        mid,
        high: Math.min(high, arr.length - 1),
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `Invariant [low=${low}, high=${high}): arr[${mid}]=${val} < ${target} → low = ${mid + 1}`,
      });
      for (let i = low; i <= mid; i++) eliminated.add(i);
      low = mid + 1;
    }
  }

  steps.push({
    title: `Converged: low == high == ${low}`,
    description: `Loop terminates when low == high. Index ${low} is the FIRST index where arr[i] ≥ ${target} (Lower Bound). Upper Bound would use strict > (${target}) instead of ≥.`,
    low,
    mid: low,
    high: low,
    foundIndex: low,
    eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
    formulaNote: `Lower Bound(${target}) = index ${low} (value ${arr[low] ?? 'N/A'})`,
  });

  return steps;
}

export function computeRotatedSearchTrace(
  arr: number[],
  target: number
): BinarySearchStep[] {
  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = arr.length - 1;
  const eliminated = new Set<number>();

  while (low <= high) {
    const mid = low + Math.floor((high - low) / 2);
    if (arr[mid] === target) {
      steps.push({
        title: `Found Target ${target} at index ${mid}`,
        description: `arr[${mid}] == ${target}. Despite the rotation pivot, halving one guaranteed sorted side each step located the target in O(log n).`,
        low,
        mid,
        high,
        foundIndex: mid,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `mid = ${mid} → arr[${mid}] = ${target} (Exact Match)`,
      });
      break;
    }

    if (arr[low] <= arr[mid]) {
      // Left half [low..mid] is sorted
      const inLeft = target >= arr[low] && target < arr[mid];
      steps.push({
        title: `Left Half [${low}..${mid}] is Sorted (${arr[low]} ≤ ${arr[mid]})`,
        description: inLeft
          ? `Target ${target} lies inside sorted range [${arr[low]}, ${arr[mid]}). Search left: high = mid - 1 (${mid - 1}).`
          : `Target ${target} is NOT inside sorted range [${arr[low]}, ${arr[mid]}). Eliminate left half and search right: low = mid + 1 (${mid + 1}).`,
        low,
        mid,
        high,
        sortedHalfRange: [low, mid],
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `arr[${low}]=${arr[low]} ≤ arr[${mid}]=${arr[mid]} → Left sorted. ${target} in [${arr[low]}, ${arr[mid]})? ${inLeft ? 'YES' : 'NO'}`,
      });
      if (inLeft) {
        for (let i = mid; i <= high; i++) eliminated.add(i);
        high = mid - 1;
      } else {
        for (let i = low; i <= mid; i++) eliminated.add(i);
        low = mid + 1;
      }
    } else {
      // Right half [mid..high] is sorted
      const inRight = target > arr[mid] && target <= arr[high];
      steps.push({
        title: `Right Half [${mid}..${high}] is Sorted (${arr[mid]} ≤ ${arr[high]})`,
        description: inRight
          ? `Target ${target} lies inside sorted range (${arr[mid]}, ${arr[high]}]. Search right: low = mid + 1 (${mid + 1}).`
          : `Target ${target} is NOT inside sorted range (${arr[mid]}, ${arr[high]}]. Eliminate right half and search left: high = mid - 1 (${mid - 1}).`,
        low,
        mid,
        high,
        sortedHalfRange: [mid, high],
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        formulaNote: `arr[${low}]=${arr[low]} > arr[${mid}]=${arr[mid]} → Right sorted. ${target} in (${arr[mid]}, ${arr[high]}]? ${inRight ? 'YES' : 'NO'}`,
      });
      if (inRight) {
        for (let i = low; i <= mid; i++) eliminated.add(i);
        low = mid + 1;
      } else {
        for (let i = mid; i <= high; i++) eliminated.add(i);
        high = mid - 1;
      }
    }
  }

  return steps;
}

export function computeAnswerSpaceTrace(
  candidates: number[],
  minFeasible: number
): BinarySearchStep[] {
  const steps: BinarySearchStep[] = [];
  let low = 0;
  let high = candidates.length - 1;
  const eliminated = new Set<number>();
  const knownPredicate: ('F' | 'T' | '?')[] = candidates.map(() => '?');

  while (low < high) {
    const mid = low + Math.floor((high - low) / 2);
    const speed = candidates[mid];
    const feasible = speed >= minFeasible;

    knownPredicate[mid] = feasible ? 'T' : 'F';
    if (feasible) {
      for (let i = mid; i < candidates.length; i++) knownPredicate[i] = 'T';
      steps.push({
        title: `Test Speed k = ${speed} → Feasible (TRUE)`,
        description: `Eating at speed ${speed} finishes within H hours. Because feasibility is monotonic, all speeds > ${speed} are also TRUE. Keep mid and try smaller speeds: high = mid (${mid}).`,
        low,
        mid,
        high,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        predicateStatus: [...knownPredicate],
        formulaNote: `canFinish(k=${speed}) == true → record candidate & set high = mid (${mid})`,
      });
      for (let i = mid + 1; i <= high; i++) eliminated.add(i);
      high = mid;
    } else {
      for (let i = 0; i <= mid; i++) knownPredicate[i] = 'F';
      steps.push({
        title: `Test Speed k = ${speed} → Too Slow (FALSE)`,
        description: `Speed ${speed} exceeds the H-hour deadline. Every speed ≤ ${speed} will also fail. Discard left side: low = mid + 1 (${mid + 1}).`,
        low,
        mid,
        high,
        eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
        predicateStatus: [...knownPredicate],
        formulaNote: `canFinish(k=${speed}) == false → discard [${low}..${mid}], set low = ${mid + 1}`,
      });
      for (let i = low; i <= mid; i++) eliminated.add(i);
      low = mid + 1;
    }
  }

  knownPredicate[low] = 'T';
  steps.push({
    title: `Minimum Feasible Answer Found: k = ${candidates[low]}`,
    description: `Search space collapsed to low == high == ${low}. k = ${candidates[low]} is the exact boundary transitioning from FALSE → TRUE.`,
    low,
    mid: low,
    high: low,
    foundIndex: low,
    eliminatedIndices: Array.from(eliminated).sort((a, b) => a - b),
    predicateStatus: [...knownPredicate],
    formulaNote: `Optimal Answer = ${candidates[low]} in O(log(maxVal) × checkCost)`,
  });

  return steps;
}

// ============================================================================
// TREE VISUAL GEOMETRY & DETERMINISTIC TRAVERSAL SEQUENCES
// ============================================================================

const STANDARD_BST_NODES: TreeNodeVisual[] = [
  { id: 'n50', label: '50', x: 260, y: 42, leftId: 'n30', rightId: 'n70', meta: 'root' },
  { id: 'n30', label: '30', x: 145, y: 120, leftId: 'n20', rightId: 'n40' },
  { id: 'n70', label: '70', x: 375, y: 120, leftId: 'n60', rightId: 'n80' },
  { id: 'n20', label: '20', x: 85, y: 200 },
  { id: 'n40', label: '40', x: 205, y: 200 },
  { id: 'n60', label: '60', x: 315, y: 200 },
  { id: 'n80', label: '80', x: 435, y: 200 },
];

const BALANCED_TREE_NODES: TreeNodeVisual[] = [
  { id: 'b4', label: '4', x: 130, y: 36, leftId: 'b2', rightId: 'b6', meta: 'd=0,h=2' },
  { id: 'b2', label: '2', x: 72, y: 108, leftId: 'b1', rightId: 'b3', meta: 'd=1,h=1' },
  { id: 'b6', label: '6', x: 188, y: 108, leftId: 'b5', rightId: 'b7', meta: 'd=1,h=1' },
  { id: 'b1', label: '1', x: 40, y: 180, meta: 'd=2,h=0' },
  { id: 'b3', label: '3', x: 104, y: 180, meta: 'd=2,h=0' },
  { id: 'b5', label: '5', x: 156, y: 180, meta: 'd=2,h=0' },
  { id: 'b7', label: '7', x: 220, y: 180, meta: 'd=2,h=0' },
];

const SKEWED_TREE_NODES: TreeNodeVisual[] = [
  { id: 's1', label: '1', x: 56, y: 32, rightId: 's2', meta: 'd=0' },
  { id: 's2', label: '2', x: 104, y: 74, rightId: 's3', meta: 'd=1' },
  { id: 's3', label: '3', x: 152, y: 116, rightId: 's4', meta: 'd=2' },
  { id: 's4', label: '4', x: 200, y: 158, rightId: 's5', meta: 'd=3' },
  { id: 's5', label: '5', x: 248, y: 200, meta: 'd=4' },
];

export function computeTreeTraversalOrder(
  order: 'inorder' | 'preorder' | 'postorder' | 'levelorder'
): string[] {
  const nodeMap = new Map(STANDARD_BST_NODES.map((n) => [n.id, n]));
  const result: string[] = [];

  if (order === 'levelorder') {
    const queue: string[] = ['n50'];
    while (queue.length > 0) {
      const id = queue.shift()!;
      const node = nodeMap.get(id);
      if (!node) continue;
      result.push(node.label);
      if (node.leftId) queue.push(node.leftId);
      if (node.rightId) queue.push(node.rightId);
    }
    return result;
  }

  const dfs = (id?: string) => {
    if (!id) return;
    const node = nodeMap.get(id);
    if (!node) return;
    if (order === 'preorder') result.push(node.label);
    dfs(node.leftId);
    if (order === 'inorder') result.push(node.label);
    dfs(node.rightId);
    if (order === 'postorder') result.push(node.label);
  };
  dfs('n50');
  return result;
}

// ============================================================================
// COMPREHENSIVE BEGINNER-TO-ADVANCED DSA CONCEPT MODULES
// ============================================================================

export const DSA_CONCEPT_MODULES: ConceptModule[] = [
  // ==========================================================================
  // MODULE 1: TREES
  // ==========================================================================
  {
    id: 'trees',
    badge: 'CONCEPT MODULE 01 · HIERARCHICAL STRUCTURES',
    title: 'Trees: Binary Trees, BSTs, Traversals & Balance',
    description:
      'Master hierarchical data structures from node pointers and BST invariants to DFS/BFS traversal mechanics, height/depth definitions, and balanced vs. skewed performance tradeoffs.',
    topics: [
      {
        id: 'binary-trees-and-bst',
        moduleId: 'trees',
        level: 'Beginner',
        title: 'Binary Trees & Binary Search Trees (BST)',
        shortTitle: 'Binary Trees & BST',
        subtitle:
          'Understand parent-child hierarchy, the strict BST ordering invariant, and logarithmic branch pruning.',
        summary:
          'A Binary Tree is a connected acyclic graph where every node has at most two children (left and right). A Binary Search Tree (BST) strengthens this with a global ordering invariant: every value in a node’s ENTIRE left subtree is strictly less than the node’s value, and every value in its ENTIRE right subtree is strictly greater—enabling O(log n) search on balanced trees by eliminating half the remaining nodes at each step.',
        visual: {
          kind: 'tree',
          mode: 'single',
          nodes: STANDARD_BST_NODES,
          steps: [
            {
              title: 'Step 1 · Start at Root (50) searching for Target = 40',
              description:
                'Every BST search begins at the root. Compare target 40 with root 50: since 40 < 50, the entire right subtree rooted at 70 (60, 70, 80) is guaranteed > 50 and can be pruned immediately.',
              activeNodeId: 'n50',
              visitedNodeIds: ['n50'],
              prunedNodeIds: ['n70', 'n60', 'n80'],
              structureLabel: 'Decision',
              structureItems: ['40 < 50 → Go Left', 'Prune right subtree (70, 60, 80)'],
              outputSequence: ['50'],
            },
            {
              title: 'Step 2 · Inspect Node 30',
              description:
                'Compare target 40 with node 30: since 40 > 30, every value in 30’s left subtree (20) is too small. Prune left child 20 and follow the right pointer.',
              activeNodeId: 'n30',
              visitedNodeIds: ['n50', 'n30'],
              prunedNodeIds: ['n70', 'n60', 'n80', 'n20'],
              highlightEdgeIds: ['n50-n30'],
              structureLabel: 'Decision',
              structureItems: ['40 > 30 → Go Right', 'Prune left child (20)'],
              outputSequence: ['50', '30'],
            },
            {
              title: 'Step 3 · Target Found at Node 40!',
              description:
                'arr/node value 40 == target 40. Found in just 3 comparisons instead of scanning all 7 nodes. If we were inserting 45, we would continue to 40.right (null) and attach a new node there.',
              activeNodeId: 'n40',
              visitedNodeIds: ['n50', 'n30', 'n40'],
              prunedNodeIds: ['n70', 'n60', 'n80', 'n20'],
              highlightEdgeIds: ['n50-n30', 'n30-n40'],
              structureLabel: 'Result',
              structureItems: ['40 == 40 ✓ Found', 'Visited 3 / 7 nodes'],
              outputSequence: ['50', '30', '40'],
            },
          ],
        },
        whenToUse: [
          'Hierarchical data representation: file systems, HTML DOM trees, JSON ASTs, and organization charts.',
          'Dynamic sorted collections needing fast Search, Insert, Delete, Floor/Ceil, and Range Queries (BST).',
          'Problems asking for Lowest Common Ancestor (LCA), kth smallest element, or validating global subtree bounds.',
          'Whenever you can prune an entire branch at each step using ordering invariants (BST property).',
        ],
        commonPitfalls: [
          'Null-node base case omission: forgetting `if root is None:` before dereferencing `root.val` or `root.left` causes NullPointerException / AttributeError.',
          'Local vs. Global BST validation bug: checking only `left.val < node.val < right.val` is WRONG! Every node in the left subtree must obey `(min_bound, node.val)` recursively.',
          'Assuming a BST is always O(log n): inserting already-sorted keys `[1, 2, 3, 4, 5]` creates a skewed linked list with O(n) height unless self-balancing (AVL / Red-Black) is used.',
          'Forgetting to reconnect modified subtrees on recursive BST insert/delete (`root.left = insert(root.left, val)`).',
        ],
        complexityTable: [
          {
            operation: 'BST Search / Insert / Delete',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(n)',
            space: 'O(h) rec / O(1) iter',
            notes: 'Worst case occurs on skewed trees (h = n). Iterative search uses O(1) space.',
          },
          {
            operation: 'Binary Tree Search (Unordered)',
            timeBest: 'O(1)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h) DFS / O(w) BFS',
            notes: 'Without BST ordering, every node may need to be visited.',
          },
          {
            operation: 'Validate BST (Min/Max Bounds)',
            timeBest: 'O(1) fail-fast',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h)',
            notes: 'Visits each node once passing strict (low, high) interval bounds.',
          },
        ],
        codeTemplates: {
          python: `from typing import Optional

class TreeNode:
    def __init__(self, val: int, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val              # Payload stored in this node
        self.left = left            # Pointer to left child (values < val in BST)
        self.right = right          # Pointer to right child (values > val in BST)

def search_bst(root: Optional[TreeNode], target: int) -> Optional[TreeNode]:
    curr = root                     # Start iterative walk at root (O(1) extra space)
    while curr is not None:         # Base guard: stop when falling off a leaf
        if curr.val == target:      # Found exact match
            return curr
        elif target < curr.val:     # Target must live in left subtree -> prune right
            curr = curr.left
        else:                       # Target must live in right subtree -> prune left
            curr = curr.right
    return None                     # Target does not exist in BST

def is_valid_bst(node: Optional[TreeNode], low=float('-inf'), high=float('inf')) -> bool:
    if node is None:                # Empty subtree trivially satisfies BST invariant
        return True
    if not (low < node.val < high): # Enforce GLOBAL ancestor bounds, not just immediate parent
        return False
    return (
        is_valid_bst(node.left, low, node.val) and   # Left subtree must stay strictly < node.val
        is_valid_bst(node.right, node.val, high)     # Right subtree must stay strictly > node.val
    )`,
          cpp: `#include <climits>

struct TreeNode {
    int val;                        // Node payload
    TreeNode* left;                 // Pointer to left child (nullptr if absent)
    TreeNode* right;                // Pointer to right child (nullptr if absent)
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

// Iterative BST Search: O(h) time, O(1) auxiliary space
TreeNode* searchBST(TreeNode* root, int target) {
    TreeNode* curr = root;          // Avoid recursion stack overhead
    while (curr != nullptr) {       // Safe null-node termination guard
        if (curr->val == target) {
            return curr;            // Exact match found
        } else if (target < curr->val) {
            curr = curr->left;      // Prune entire right subtree
        } else {
            curr = curr->right;     // Prune entire left subtree
        }
    }
    return nullptr;                 // Not found
}

// Validate BST using 64-bit bounds to avoid INT_MIN / INT_MAX edge-case overflow
bool isValidBST(TreeNode* node, long long low = LLONG_MIN, long long high = LLONG_MAX) {
    if (node == nullptr) return true;                // Empty tree is valid
    if (node->val <= low || node->val >= high)       // Violates ancestor constraint
        return false;
    return isValidBST(node->left, low, node->val) && // Tighten upper bound for left
           isValidBST(node->right, node->val, high); // Tighten lower bound for right
}`,
          c: `#include <stdbool.h>
#include <limits.h>
#include <stddef.h>

typedef struct TreeNode {
    int val;
    struct TreeNode* left;
    struct TreeNode* right;
} TreeNode;

// Iterative BST Search: O(h) time, O(1) space
TreeNode* searchBST(TreeNode* root, int target) {
    TreeNode* curr = root;
    while (curr != NULL) {          // Guard against NULL dereference
        if (curr->val == target) {
            return curr;            // Match found
        } else if (target < curr->val) {
            curr = curr->left;      // Go left; prune right subtree
        } else {
            curr = curr->right;     // Go right; prune left subtree
        }
    }
    return NULL;                    // Target absent
}

// Recursive BST validation with 64-bit bounds to prevent 32-bit int edge bugs
bool validateHelper(const TreeNode* node, long long low, long long high) {
    if (node == NULL) return true;                    // Null base case
    if (node->val <= low || node->val >= high)        // Global range check
        return false;
    return validateHelper(node->left, low, node->val) &&
           validateHelper(node->right, node->val, high);
}

bool isValidBST(const TreeNode* root) {
    return validateHelper(root, LLONG_MIN, LLONG_MAX);
}`,
        },
        practiceFilterCategory: 'Trees',
      },
      {
        id: 'tree-traversals',
        moduleId: 'trees',
        level: 'Beginner',
        title: 'Tree Traversals: Inorder, Preorder & Postorder',
        shortTitle: 'Inorder / Pre / Post',
        subtitle:
          'Step through how recursive DFS orderings visit Left, Root, and Right—and why each order solves a distinct class of problems.',
        summary:
          'All three classic DFS traversals visit every node in the exact same Euler tour shape; the ONLY difference is WHEN you process the current node relative to its children. Preorder (Root→L→R) processes top-down, Inorder (L→Root→R) yields sorted order on a BST, and Postorder (L→R→Root) aggregates results bottom-up from children before deciding on the parent.',
        visual: {
          kind: 'tree',
          mode: 'single',
          nodes: STANDARD_BST_NODES,
          steps: [
            {
              title: 'Inorder (L → Root → R): Dive to Leftmost Leaf (20)',
              description:
                'Inorder starts at 50 → pushes 50, dives to 30 → pushes 30, dives to 20. Node 20 has no left child, so 20 is the FIRST node emitted!',
              activeNodeId: 'n20',
              visitedNodeIds: ['n20'],
              highlightEdgeIds: ['n50-n30', 'n30-n20'],
              structureLabel: 'Inorder Stack',
              structureItems: ['50', '30', '20 (emit)'],
              outputSequence: ['20'],
            },
            {
              title: 'Inorder: Unwind to Parent (30) then Right Child (40)',
              description:
                'After finishing 20, unwind to 30 and emit 30, then visit 30’s right child 40 and emit 40. Notice the output [20, 30, 40] is strictly sorted!',
              activeNodeId: 'n40',
              visitedNodeIds: ['n20', 'n30', 'n40'],
              highlightEdgeIds: ['n50-n30', 'n30-n40'],
              structureLabel: 'Inorder Stack',
              structureItems: ['50', '40 (emit)'],
              outputSequence: ['20', '30', '40'],
            },
            {
              title: 'Inorder: Visit Root (50) then Right Subtree (60 → 70 → 80)',
              description:
                'With left subtree done, emit Root 50, then dive into right subtree (70 → 60 → 70 → 80). Full Inorder: [20, 30, 40, 50, 60, 70, 80] — sorted ascending!',
              activeNodeId: 'n80',
              visitedNodeIds: ['n20', 'n30', 'n40', 'n50', 'n60', 'n70', 'n80'],
              highlightEdgeIds: ['n50-n70', 'n70-n60', 'n70-n80'],
              structureLabel: 'Inorder Complete',
              structureItems: ['BST Inorder = Sorted Array'],
              outputSequence: ['20', '30', '40', '50', '60', '70', '80'],
            },
            {
              title: 'Preorder (Root → L → R): Emit Immediately on Entry',
              description:
                'Preorder processes each node BEFORE descending: Root 50 first, then left subtree (30, 20, 40), then right subtree (70, 60, 80). Ideal for cloning/serializing tree structure.',
              activeNodeId: 'n50',
              visitedNodeIds: ['n50', 'n30', 'n20', 'n40', 'n70', 'n60', 'n80'],
              highlightEdgeIds: ['n50-n30', 'n50-n70'],
              structureLabel: 'Preorder Rule',
              structureItems: ['Visit Root → Left → Right'],
              outputSequence: ['50', '30', '20', '40', '70', '60', '80'],
            },
            {
              title: 'Postorder (L → R → Root): Children First, Root Last',
              description:
                'Postorder finishes both children before touching parent: (20, 40, 30), then (60, 80, 70), and Root 50 VERY LAST. Essential for deleting trees, computing subtree heights, or evaluating expression trees.',
              activeNodeId: 'n50',
              visitedNodeIds: ['n20', 'n40', 'n30', 'n60', 'n80', 'n70', 'n50'],
              highlightEdgeIds: ['n30-n20', 'n30-n40', 'n70-n60', 'n70-n80'],
              structureLabel: 'Postorder Rule',
              structureItems: ['Left → Right → Visit Root'],
              outputSequence: ['20', '40', '30', '60', '80', '70', '50'],
            },
          ],
        },
        whenToUse: [
          'Inorder (L → Root → R): Retrieving BST keys in sorted order, finding the Kth smallest BST element, or flattening a BST to a sorted doubly-linked list.',
          'Preorder (Root → L → R): Serializing/cloning a tree, passing top-down state (path sums, prefix strings, ancestor bounds) from root toward leaves.',
          'Postorder (L → R → Root): Bottom-up aggregation where a parent depends on its children—tree height, diameter, max path sum, subtree size, and safe memory deallocation.',
          'Reconstructing a unique binary tree from two traversal arrays (e.g., Preorder + Inorder).',
        ],
        commonPitfalls: [
          'Confusing iterative stack push order: for iterative Preorder using a LIFO stack, push RIGHT child before LEFT child so LEFT pops first.',
          'Mutating a shared path/list during DFS without backtracking (`path.pop()`), causing sibling branches to inherit stale elements.',
          'Stack overflow in C++/Python on deep skewed trees (n = 100,000 exceeds default recursion limit ~1,000 in Python); switch to explicit stack or Morris Traversal.',
          'Forgetting the null-node base case (`if not node: return`) at the very top of the recursive helper.',
        ],
        complexityTable: [
          {
            operation: 'Recursive DFS (In/Pre/Post)',
            timeBest: 'O(n)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h) call stack',
            notes: 'Balanced tree: O(log n) stack; Skewed tree: O(n) stack.',
          },
          {
            operation: 'Iterative DFS (Explicit Stack)',
            timeBest: 'O(n)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h) stack',
            notes: 'Avoids recursion depth limits while maintaining identical visit order.',
          },
          {
            operation: 'Morris Traversal (Threaded)',
            timeBest: 'O(n)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(1) auxiliary',
            notes: 'Temporarily links inorder predecessor right pointer; restores tree cleanly.',
          },
        ],
        codeTemplates: {
          python: `from typing import Optional, List

class TreeNode:
    def __init__(self, val: int, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

# 1. Recursive Templates (Cleanest & Most Common)
def inorder(root: Optional[TreeNode], out: List[int]) -> None:
    if root is None:                # Null-node base case
        return
    inorder(root.left, out)         # 1) Traverse Left subtree
    out.append(root.val)            # 2) Visit Root (sorted order in BST!)
    inorder(root.right, out)        # 3) Traverse Right subtree

def preorder(root: Optional[TreeNode], out: List[int]) -> None:
    if root is None:
        return
    out.append(root.val)            # 1) Visit Root BEFORE children (top-down)
    preorder(root.left, out)        # 2) Left
    preorder(root.right, out)       # 3) Right

def postorder(root: Optional[TreeNode], out: List[int]) -> None:
    if root is None:
        return
    postorder(root.left, out)       # 1) Left
    postorder(root.right, out)      # 2) Right
    out.append(root.val)            # 3) Visit Root AFTER children (bottom-up)

# 2. Iterative Inorder (Safe against Python recursion limit on skewed trees)
def inorder_iterative(root: Optional[TreeNode]) -> List[int]:
    stack, res, curr = [], [], root
    while curr is not None or stack:
        while curr is not None:     # Push spine down to leftmost node
            stack.append(curr)
            curr = curr.left
        curr = stack.pop()          # Process leftmost unvisited node
        res.append(curr.val)
        curr = curr.right           # Pivot to its right subtree
    return res`,
          cpp: `#include <vector>
#include <stack>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

// Recursive Inorder (L -> Root -> R): emits sorted keys for any BST
void inorder(TreeNode* root, vector<int>& out) {
    if (!root) return;              // Base case: null node
    inorder(root->left, out);       // 1. Left
    out.push_back(root->val);       // 2. Root
    inorder(root->right, out);      // 3. Right
}

// Recursive Preorder (Root -> L -> R): top-down structure capture
void preorder(TreeNode* root, vector<int>& out) {
    if (!root) return;
    out.push_back(root->val);       // 1. Root
    preorder(root->left, out);      // 2. Left
    preorder(root->right, out);     // 3. Right
}

// Recursive Postorder (L -> R -> Root): bottom-up aggregation / safe deletion
void postorder(TreeNode* root, vector<int>& out) {
    if (!root) return;
    postorder(root->left, out);     // 1. Left
    postorder(root->right, out);    // 2. Right
    out.push_back(root->val);       // 3. Root
}

// Iterative Inorder using std::stack: O(n) time, O(h) space
vector<int> inorderIterative(TreeNode* root) {
    vector<int> res;
    stack<TreeNode*> st;
    TreeNode* curr = root;
    while (curr != nullptr || !st.empty()) {
        while (curr != nullptr) {   // Walk down left spine
            st.push(curr);
            curr = curr->left;
        }
        curr = st.top();            // Visit node
        st.pop();
        res.push_back(curr->val);
        curr = curr->right;         // Explore right subtree
    }
    return res;
}`,
          c: `#include <stdio.h>
#include <stddef.h>

typedef struct TreeNode {
    int val;
    struct TreeNode* left;
    struct TreeNode* right;
} TreeNode;

// Inorder (Left -> Root -> Right): sorted output on a BST
void inorder(const TreeNode* root) {
    if (root == NULL) return;       // Base case: stop at NULL leaf child
    inorder(root->left);            // 1. Visit left subtree
    printf("%d ", root->val);       // 2. Process current node
    inorder(root->right);           // 3. Visit right subtree
}

// Preorder (Root -> Left -> Right): root emitted before subtrees
void preorder(const TreeNode* root) {
    if (root == NULL) return;
    printf("%d ", root->val);       // 1. Process current node first
    preorder(root->left);           // 2. Left
    preorder(root->right);          // 3. Right
}

// Postorder (Left -> Right -> Root): children processed before parent
void postorder(const TreeNode* root) {
    if (root == NULL) return;
    postorder(root->left);          // 1. Left
    postorder(root->right);         // 2. Right
    printf("%d ", root->val);       // 3. Process parent last (ideal for free())
}`,
        },
        practiceFilterCategory: 'Trees',
      },
      {
        id: 'bfs-vs-dfs',
        moduleId: 'trees',
        level: 'Intermediate',
        title: 'Level Order (BFS) vs. Depth-First Search (DFS)',
        shortTitle: 'Level Order (BFS) vs DFS',
        subtitle:
          'Compare FIFO Queue wave expansion against LIFO Call-Stack plunging—and pick the right engine for shortest depth vs. path search.',
        summary:
          'Level Order Traversal (Breadth-First Search) uses a FIFO Queue to explore a tree wave by wave (Level 0, Level 1, Level 2...), guaranteeing that the first leaf you encounter has the minimum depth. Depth-First Search (DFS) uses a LIFO stack/recursion to plunge all the way down one branch before backtracking—using far less memory on wide, balanced trees (O(log n) vs. O(n/2) for BFS).',
        visual: {
          kind: 'tree',
          mode: 'single',
          nodes: STANDARD_BST_NODES,
          steps: [
            {
              title: 'BFS Wave 0 (Depth 0) · Enqueue Root 50',
              description:
                'Initialize FIFO Queue with [50]. Snapshot level_size = len(queue) = 1 so we isolate Level 0 cleanly. Pop 50 and enqueue its children (30, 70).',
              activeNodeId: 'n50',
              visitedNodeIds: ['n50'],
              structureLabel: 'BFS FIFO Queue',
              structureItems: ['Pop: 50', 'Next Queue: [30, 70]'],
              outputSequence: ['L0: [50]'],
            },
            {
              title: 'BFS Wave 1 (Depth 1) · Process Level Size = 2',
              description:
                'Snapshot level_size = 2. Pop 30 (enqueue 20, 40) and pop 70 (enqueue 60, 80). Notice BFS finishes EVERY node at depth 1 before touching any node at depth 2.',
              activeNodeId: 'n70',
              visitedNodeIds: ['n50', 'n30', 'n70'],
              highlightEdgeIds: ['n50-n30', 'n50-n70'],
              structureLabel: 'BFS FIFO Queue',
              structureItems: ['Pop: 30, 70', 'Next Queue: [20, 40, 60, 80]'],
              outputSequence: ['L0: [50]', 'L1: [30, 70]'],
            },
            {
              title: 'BFS Wave 2 (Depth 2) · Leaf Layer Peak Memory',
              description:
                'Snapshot level_size = 4. Pop 20, 40, 60, 80. Notice the queue peaked at 4 nodes (≈ n/2 = O(w) width)—this is why BFS uses O(n) space on a full binary tree.',
              activeNodeId: 'n80',
              visitedNodeIds: ['n50', 'n30', 'n70', 'n20', 'n40', 'n60', 'n80'],
              highlightEdgeIds: ['n30-n20', 'n30-n40', 'n70-n60', 'n70-n80'],
              structureLabel: 'BFS Peak Width',
              structureItems: ['Queue Peak = 4 (n/2)', 'All levels complete'],
              outputSequence: ['L0: [50]', 'L1: [30, 70]', 'L2: [20, 40, 60, 80]'],
            },
            {
              title: 'Contrast: DFS Plunges Deep First (Stack O(h))',
              description:
                'By contrast, DFS plunges 50 → 30 → 20 straight to a leaf before ever seeing 70. Stack depth is at most height h = 3 (O(log n)), much smaller than BFS width on wide balanced trees!',
              activeNodeId: 'n20',
              visitedNodeIds: ['n50', 'n30', 'n20'],
              highlightEdgeIds: ['n50-n30', 'n30-n20'],
              structureLabel: 'DFS Call Stack',
              structureItems: ['[50, 30, 20]', 'Peak Stack = h (log n)'],
              outputSequence: ['DFS Branch: 50 → 30 → 20'],
            },
          ],
        },
        whenToUse: [
          'Use BFS (Level Order) for: shortest path / minimum depth to a leaf, level-by-level grouping, zigzag traversal, and Right Side View (last element of each level).',
          'Use DFS (Recursion/Stack) for: root-to-leaf path problems, subtree aggregations (height, diameter, LCA), and when tree is very wide and balanced (saving memory).',
          'Use BFS when the target is expected to be shallow (close to root) in a very deep or infinite tree.',
        ],
        commonPitfalls: [
          'Using Python `list.pop(0)` for BFS Queue: that is O(n) per pop, degrading the entire BFS to O(n²)! Always use `collections.deque` with `popleft()` (O(1)).',
          'Forgetting to freeze `level_size = len(queue)` before the inner loop: if you loop `while queue:` without snapshotting the level count, current and next level nodes mix together.',
          'Pushing `None` children into the queue without checking `if node.left:` causes unnecessary iterations or Null crashes.',
          'Memory tradeoff confusion: BFS space is O(max width) = O(n/2) on balanced trees, whereas DFS space is O(height) = O(log n) on balanced trees—but O(n) on skewed trees!',
        ],
        complexityTable: [
          {
            operation: 'Level Order (BFS) w/ Deque',
            timeBest: 'O(n)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(w) ≤ O(n)',
            notes: 'Max width w = n/2 on complete binary tree; O(1) on skewed tree.',
          },
          {
            operation: 'Min Depth via BFS (Early Exit)',
            timeBest: 'O(1)',
            timeAverage: 'O(2^d)',
            timeWorst: 'O(n)',
            space: 'O(w)',
            notes: 'Stops at the very first leaf encountered—faster than DFS on asymmetric trees.',
          },
          {
            operation: 'Full DFS (Stack / Recursion)',
            timeBest: 'O(n)',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h)',
            notes: 'O(log n) on balanced tree, O(n) on skewed chain.',
          },
        ],
        codeTemplates: {
          python: `from collections import deque
from typing import Optional, List

class TreeNode:
    def __init__(self, val: int, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

# Level Order Traversal (BFS) grouped by depth level
def level_order_bfs(root: Optional[TreeNode]) -> List[List[int]]:
    if root is None:                    # Always guard against an empty tree
        return []
    result: List[List[int]] = []
    queue = deque([root])               # Use deque for O(1) popleft() (NEVER list.pop(0))

    while queue:
        level_size = len(queue)         # Freeze exact count of nodes in THIS level
        current_level: List[int] = []
        for _ in range(level_size):     # Process only the frozen wave
            node = queue.popleft()
            current_level.append(node.val)
            if node.left is not None:   # Enqueue non-null children for next wave
                queue.append(node.left)
            if node.right is not None:
                queue.append(node.right)
        result.append(current_level)
    return result

# Minimum Depth using BFS (Early Exit guarantees optimal shortest depth)
def min_depth_bfs(root: Optional[TreeNode]) -> int:
    if root is None:
        return 0
    queue = deque([(root, 1)])          # Store (node, depth) pairs
    while queue:
        node, depth = queue.popleft()
        if node.left is None and node.right is None:
            return depth                # First leaf seen in BFS is guaranteed shallowest!
        if node.left:
            queue.append((node.left, depth + 1))
        if node.right:
            queue.append((node.right, depth + 1))
    return 0`,
          cpp: `#include <vector>
#include <queue>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

// Level Order Traversal (BFS) using std::queue: O(n) time, O(w) space
vector<vector<int>> levelOrderBFS(TreeNode* root) {
    vector<vector<int>> levels;
    if (!root) return levels;           // Null-root guard

    queue<TreeNode*> q;
    q.push(root);                       // Seed queue with Level 0

    while (!q.empty()) {
        int levelSize = static_cast<int>(q.size()); // Snapshot current wave size
        vector<int> currentLevel;
        currentLevel.reserve(levelSize);

        for (int i = 0; i < levelSize; ++i) {
            TreeNode* node = q.front();
            q.pop();
            currentLevel.push_back(node->val);

            if (node->left)  q.push(node->left);    // Queue next wave children
            if (node->right) q.push(node->right);
        }
        levels.push_back(move(currentLevel));
    }
    return levels;
}`,
          c: `#include <stdio.h>
#include <stdlib.h>

typedef struct TreeNode {
    int val;
    struct TreeNode* left;
    struct TreeNode* right;
} TreeNode;

// Level Order BFS in C using a circular array queue (maxNodes capacity)
void levelOrderBFS(TreeNode* root, int maxNodes) {
    if (root == NULL) return;           // Empty tree guard

    TreeNode** queue = (TreeNode**)malloc(sizeof(TreeNode*) * maxNodes);
    int head = 0, tail = 0;
    queue[tail++] = root;               // Enqueue root

    while (head < tail) {
        int levelSize = tail - head;    // Freeze number of nodes at current depth
        printf("[ ");
        for (int i = 0; i < levelSize; i++) {
            TreeNode* node = queue[head++]; // O(1) dequeue
            printf("%d ", node->val);
            if (node->left != NULL)  queue[tail++] = node->left;
            if (node->right != NULL) queue[tail++] = node->right;
        }
        printf("]\\n");
    }
    free(queue);                        // Release dynamically allocated queue buffer
}`,
        },
        practiceFilterCategory: 'Trees',
      },
      {
        id: 'height-depth-balanced-skewed',
        moduleId: 'trees',
        level: 'Advanced',
        title: 'Height, Depth & Balanced vs. Skewed Trees',
        shortTitle: 'Height & Balanced vs Skewed',
        subtitle:
          'Distinguish top-down Depth from bottom-up Height, detect imbalance in O(n) single pass, and understand why balance preserves O(log n).',
        summary:
          'Depth measures edges from the Root DOWN to a node (top-down, Root depth = 0). Height measures the longest path from a node DOWN to a leaf (bottom-up, Leaf height = 0, null height = -1 or 0 by node-count convention). A Binary Tree is Height-Balanced if for EVERY node, |height(left) - height(right)| ≤ 1. Without balance, a BST degenerates into a Skewed Tree (a linked list) of height n, degrading every O(log n) operation to O(n).',
        visual: {
          kind: 'tree',
          mode: 'comparison',
          nodes: BALANCED_TREE_NODES,
          comparisonNodes: SKEWED_TREE_NODES,
          comparisonTitleLeft: 'Balanced BST (h = 2 = ⌊log₂ 7⌋)',
          comparisonTitleRight: 'Skewed BST (h = 4 = n − 1)',
          comparisonMetaLeft: 'Every node: |h(L) − h(R)| ≤ 1 → O(log n) ops',
          comparisonMetaRight: 'Degenerate chain → O(n) worst-case ops',
          steps: [
            {
              title: 'Step 1 · Depth vs. Height Convention',
              description:
                'On the Balanced Tree (left), Root 4 has Depth d = 0 and Height h = 2 (2 edges to leaf). Leaves (1, 3, 5, 7) have Depth d = 2 and Height h = 0. Depth grows top-down; Height aggregates bottom-up.',
              activeNodeId: 'b4',
              visitedNodeIds: ['b4', 's1'],
              structureLabel: 'Metric Rule',
              structureItems: ['Depth: Root → Node', 'Height: Node → Deepest Leaf'],
              outputSequence: ['Balanced h=2', 'Skewed h=4'],
            },
            {
              title: 'Step 2 · Bottom-Up Balance Verification (Postorder)',
              description:
                'To check balance in O(n) instead of O(n²), use Postorder DFS: each child returns its height—or sentinel -1 immediately if its own subtree is already unbalanced.',
              activeNodeId: 'b2',
              visitedNodeIds: ['b1', 'b3', 'b2', 's5', 's4'],
              highlightEdgeIds: ['b2-b1', 'b2-b3', 's4-s5'],
              structureLabel: 'Balance Factor',
              structureItems: ['Node 2: |0 - 0| = 0 ≤ 1 ✓', 'Skewed Node 3: |(-1) - 1| = 2 > 1 ✗'],
              outputSequence: ['Balanced: OK', 'Skewed: -1 Propagated'],
            },
            {
              title: 'Step 3 · Performance Impact at n = 1,000,000 Nodes',
              description:
                'A Balanced BST (AVL / Red-Black) with 1,000,000 nodes has height ≈ 20 (max 20 steps to search!). A Skewed BST with 1,000,000 nodes has height 999,999 — 50,000× slower AND overflows the recursion stack.',
              activeNodeId: 'b7',
              visitedNodeIds: ['b4', 'b2', 'b6', 'b1', 'b3', 'b5', 'b7', 's1', 's2', 's3', 's4', 's5'],
              highlightEdgeIds: ['b4-b6', 'b6-b7', 's1-s2', 's2-s3', 's3-s4', 's4-s5'],
              structureLabel: '1M Nodes Search',
              structureItems: ['Balanced: ~20 steps', 'Skewed: 1,000,000 steps'],
              outputSequence: ['O(log n) vs O(n)'],
            },
          ],
        },
        whenToUse: [
          'Computing tree Height, Diameter, or Maximum Path Sum → always use Postorder bottom-up DFS returning height to parent.',
          'Checking if a tree is Height-Balanced in O(n) time using the `-1` early-abort sentinel pattern.',
          'Choosing self-balancing trees (AVL, Red-Black, B-Trees) when input keys may arrive sorted or nearly sorted.',
        ],
        commonPitfalls: [
          'O(n²) naive balance check: calling `height(root.left)` and `height(root.right)` from top to bottom recomputes heights redundantly at every level. Always combine height + balance check in ONE bottom-up pass.',
          'Mixing up edge-count height (`null -> -1, leaf -> 0`) vs. node-count height (`null -> 0, leaf -> 1`). Clarify which convention the problem expects (LeetCode Maximum Depth uses node-count: `null -> 0`).',
          'Checking balance only at the root (`|h(root.left) - h(root.right)| <= 1`) misses imbalances hidden deeper inside subtrees!',
        ],
        complexityTable: [
          {
            operation: 'Single-Pass Balance Check (Postorder)',
            timeBest: 'O(h) early abort',
            timeAverage: 'O(n)',
            timeWorst: 'O(n)',
            space: 'O(h)',
            notes: 'Sentinel -1 propagates imbalance upward immediately.',
          },
          {
            operation: 'Naive Top-Down Balance Check',
            timeBest: 'O(n)',
            timeAverage: 'O(n log n)',
            timeWorst: 'O(n²)',
            space: 'O(h)',
            notes: 'Avoid! Recomputes subtree heights repeatedly on skewed trees.',
          },
          {
            operation: 'Self-Balancing BST (AVL / RB) Ops',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1) iter',
            notes: 'Rotations guarantee h = O(log n) even on sorted insertions.',
          },
        ],
        codeTemplates: {
          python: `from typing import Optional

class TreeNode:
    def __init__(self, val: int, left: Optional['TreeNode'] = None, right: Optional['TreeNode'] = None):
        self.val = val
        self.left = left
        self.right = right

# Max Depth / Height (node-count convention: empty tree = 0, single node = 1)
def max_height(root: Optional[TreeNode]) -> int:
    if root is None:                            # Base case: null contributes 0 height
        return 0
    return 1 + max(max_height(root.left), max_height(root.right))

# Optimal O(n) Height-Balanced Check using bottom-up Postorder sentinel (-1 = unbalanced)
def is_balanced(root: Optional[TreeNode]) -> bool:
    def check_height(node: Optional[TreeNode]) -> int:
        if node is None:                        # Empty subtree has height 0 and is balanced
            return 0
        left_h = check_height(node.left)        # 1. Check left subtree first
        if left_h == -1:                        # Short-circuit if left is already imbalanced
            return -1
        right_h = check_height(node.right)      # 2. Check right subtree
        if right_h == -1:                       # Short-circuit if right is already imbalanced
            return -1
        if abs(left_h - right_h) > 1:           # 3. Balance invariant violated at this node
            return -1
        return 1 + max(left_h, right_h)         # Return valid height upward to parent

    return check_height(root) != -1`,
          cpp: `#include <algorithm>
#include <cmath>
using namespace std;

struct TreeNode {
    int val;
    TreeNode* left;
    TreeNode* right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

// Bottom-up Postorder helper: returns subtree height, or -1 if imbalanced
int checkHeight(TreeNode* node) {
    if (!node) return 0;                        // Null base case: height 0
    int leftH = checkHeight(node->left);        // Evaluate left subtree
    if (leftH == -1) return -1;                 // Early exit propagation

    int rightH = checkHeight(node->right);      // Evaluate right subtree
    if (rightH == -1) return -1;                // Early exit propagation

    if (abs(leftH - rightH) > 1) return -1;     // Imbalance detected at current node
    return 1 + max(leftH, rightH);              // Valid height passed up
}

// Single-pass O(n) time, O(h) space balanced check
bool isBalanced(TreeNode* root) {
    return checkHeight(root) != -1;
}`,
          c: `#include <stdbool.h>
#include <stdlib.h>

typedef struct TreeNode {
    int val;
    struct TreeNode* left;
    struct TreeNode* right;
} TreeNode;

static int maxInt(int a, int b) { return a > b ? a : b; }

// Returns height (>= 0) if balanced, or -1 immediately on any imbalance
int checkHeight(const TreeNode* node) {
    if (node == NULL) return 0;                 // Base case: empty subtree height = 0
    int leftH = checkHeight(node->left);
    if (leftH == -1) return -1;                 // Propagate failure immediately

    int rightH = checkHeight(node->right);
    if (rightH == -1) return -1;

    if (abs(leftH - rightH) > 1) return -1;     // Height difference exceeds 1
    return 1 + maxInt(leftH, rightH);           // Return subtree height to parent
}

bool isBalanced(const TreeNode* root) {
    return checkHeight(root) != -1;
}`,
        },
        practiceFilterCategory: 'Trees',
      },
    ],
  },

  // ==========================================================================
  // MODULE 2: BINARY SEARCH STRATEGIES
  // ==========================================================================
  {
    id: 'binary-search',
    badge: 'CONCEPT MODULE 02 · DIVIDE & CONQUER SEARCH',
    title: 'Binary Search Strategies: Bounds, Rotations & Answer Space',
    description:
      'Go beyond textbook array lookups—master loop invariants, duplicate boundary queries (lower/upper bound), rotated sorted arrays, and monotonic Binary Search on Answer Space.',
    topics: [
      {
        id: 'standard-binary-search',
        moduleId: 'binary-search',
        level: 'Beginner',
        title: 'Standard Binary Search',
        shortTitle: 'Standard Binary Search',
        subtitle:
          'Halve a sorted search space on every comparison with exact closed-interval invariants [low, high].',
        summary:
          'Standard Binary Search locates a target inside a sorted array by maintaining a closed search window [low, high]. At each iteration, we probe the midpoint `mid = low + (high - low) / 2`. If `arr[mid] == target`, we return immediately; otherwise we eliminate an entire half (including `mid`) because monotonicity guarantees the target cannot exist there.',
        visual: {
          kind: 'binary-search',
          arrayValues: [4, 9, 15, 22, 31, 42, 57, 68, 84],
          targetLabel: 'Target = 57',
          axisCaption: 'Sorted Array Indices [0..8] · Closed Interval [low, high]',
          steps: computeStandardBinarySearchTrace(
            [4, 9, 15, 22, 31, 42, 57, 68, 84],
            57
          ),
        },
        whenToUse: [
          'Input array or list is already sorted (ascending or descending) and you need O(log n) membership or index lookup.',
          'Static datasets queried repeatedly: sorting once in O(n log n) followed by Q binary searches in O(Q log n) beats O(Q × n) linear scans.',
          'Finding an exact match when elements are unique or any matching index is acceptable.',
        ],
        commonPitfalls: [
          'Integer overflow in C/C++/Java: writing `(low + high) / 2` overflows signed 32-bit `int` when `low + high > 2,147,483,647`! ALWAYS write `low + (high - low) / 2`.',
          'Off-by-one loop condition: with closed interval `[low, high]`, using `while (low < high)` skips checking the final single element when `low == high`. Use `while (low <= high)`.',
          'Infinite loop bug: writing `low = mid` or `high = mid` inside a `while (low <= high)` loop fails to shrink the interval when `low == high == mid`. Always exclude `mid` (`mid + 1` / `mid - 1`).',
          'Forgetting the sorted precondition: Binary Search produces silently wrong answers on unsorted data.',
        ],
        complexityTable: [
          {
            operation: 'Iterative Binary Search',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Best case hits target on the first midpoint probe.',
          },
          {
            operation: 'Recursive Binary Search',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(log n)',
            notes: 'Call stack grows with recursion depth; prefer iterative in interviews.',
          },
        ],
        codeTemplates: {
          python: `from typing import List

def binary_search(nums: List[int], target: int) -> int:
    low = 0                             # Left boundary of closed window [low, high]
    high = len(nums) - 1                # Right boundary (inclusive)

    while low <= high:                  # Continue while window has >= 1 element
        mid = low + (high - low) // 2   # Overflow-safe midpoint calculation
        if nums[mid] == target:         # Exact match found
            return mid
        elif nums[mid] < target:        # Target must be strictly to the right of mid
            low = mid + 1               # Exclude mid to guarantee window shrinks
        else:                           # Target must be strictly to the left of mid
            high = mid - 1              # Exclude mid to guarantee window shrinks

    return -1                           # Search window exhausted: target not found`,
          cpp: `#include <vector>
using namespace std;

// Standard Iterative Binary Search: O(log n) time, O(1) space
int binarySearch(const vector<int>& nums, int target) {
    int low = 0;                                // Inclusive left pointer
    int high = static_cast<int>(nums.size()) - 1; // Inclusive right pointer

    while (low <= high) {                       // Must be <= for closed [low, high]
        int mid = low + (high - low) / 2;       // Prevents (low + high) 32-bit int overflow!
        if (nums[mid] == target) {
            return mid;                         // Exact target found
        } else if (nums[mid] < target) {
            low = mid + 1;                      // Discard left half including mid
        } else {
            high = mid - 1;                     // Discard right half including mid
        }
    }
    return -1;                                  // Target absent
}`,
          c: `#include <stddef.h>

// Standard Iterative Binary Search in C: O(log n) time, O(1) space
int binarySearch(const int* nums, int n, int target) {
    int low = 0;
    int high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;       // Safe against signed 32-bit overflow
        if (nums[mid] == target) {
            return mid;                         // Match found
        } else if (nums[mid] < target) {
            low = mid + 1;                      // Narrow window to [mid + 1, high]
        } else {
            high = mid - 1;                     // Narrow window to [low, mid - 1]
        }
    }
    return -1;                                  // Not found
}`,
        },
        practiceFilterCategory: 'Binary Search',
      },
      {
        id: 'lower-upper-bound',
        moduleId: 'binary-search',
        level: 'Intermediate',
        title: 'Lower Bound & Upper Bound (Duplicate Handling)',
        shortTitle: 'Lower & Upper Bound',
        subtitle:
          'Master the half-open [low, high) template to find first/last occurrences, insertion indices, and frequency counts in O(log n).',
        summary:
          'When a sorted array contains duplicates, Standard Binary Search returns an arbitrary matching index. Lower Bound finds the FIRST index `i` where `arr[i] >= target`, while Upper Bound finds the FIRST index `i` where `arr[i] > target`. Using the half-open interval `[low, high)` with `high = n` unifies both patterns cleanly: `count(target) = upperBound(target) - lowerBound(target)`.',
        visual: {
          kind: 'binary-search',
          arrayValues: [2, 5, 8, 8, 8, 12, 16, 20],
          targetLabel: 'Lower Bound of Target = 8',
          axisCaption: 'Sorted Array with Duplicates · Half-Open Invariant [low, high)',
          steps: computeLowerBoundTrace([2, 5, 8, 8, 8, 12, 16, 20], 8),
        },
        whenToUse: [
          'Finding the FIRST and LAST position of a target element in a sorted array with duplicates.',
          'Finding the Search Insert Position (smallest index where target can be inserted while keeping sorted order).',
          'Counting how many elements fall in a range `[L, R]` via `upper_bound(R) - lower_bound(L)`.',
          'Finding Ceiling (`lower_bound`) or Floor (`upper_bound - 1`) of a value in O(log n).',
        ],
        commonPitfalls: [
          'Initializing `high = n - 1` instead of `high = n`: if `target` is greater than every element in the array, the valid insertion index is `n`, which `high = n - 1` can never return!',
          'Using `while (low <= high)` with `high = mid`: causes an INFINITE LOOP once `low == high == mid`! Half-open `[low, high)` MUST use `while (low < high)`.',
          'Forgetting post-loop existence check: `lower_bound` returns the insertion point, NOT confirmation of equality. Always verify `idx < n && arr[idx] == target` before claiming a match.',
          'Mixing up `>=` (Lower Bound) and `>` (Upper Bound): that single operator is the entire difference between the first and last occurrence.',
        ],
        complexityTable: [
          {
            operation: 'Lower Bound (first ≥ target)',
            timeBest: 'O(log n)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Always runs full log₂(n) halvings to guarantee leftmost boundary.',
          },
          {
            operation: 'Upper Bound (first > target)',
            timeBest: 'O(log n)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Last occurrence of target is upper_bound(target) - 1.',
          },
          {
            operation: 'Frequency Count in Sorted Array',
            timeBest: 'O(log n)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Two binary searches beat O(n) linear scan even when duplicates dominate.',
          },
        ],
        codeTemplates: {
          python: `from typing import List, Tuple

# Lower Bound: smallest index i in [0, n] such that nums[i] >= target
def lower_bound(nums: List[int], target: int) -> int:
    low, high = 0, len(nums)            # Half-open [low, high) allows returning len(nums)
    while low < high:                   # Strictly < prevents infinite loop when high = mid
        mid = low + (high - low) // 2
        if nums[mid] >= target:         # mid could be the first occurrence -> keep it!
            high = mid
        else:                           # nums[mid] < target -> strictly too small
            low = mid + 1
    return low                          # low == high is the exact lower bound

# Upper Bound: smallest index i in [0, n] such that nums[i] > target
def upper_bound(nums: List[int], target: int) -> int:
    low, high = 0, len(nums)
    while low < high:
        mid = low + (high - low) // 2
        if nums[mid] > target:          # Strict > skips past all copies of target
            high = mid
        else:
            low = mid + 1
    return low

# First & Last occurrence of target (or (-1, -1) if absent)
def search_range(nums: List[int], target: int) -> Tuple[int, int]:
    first = lower_bound(nums, target)
    if first == len(nums) or nums[first] != target:  # Crucial post-loop validation!
        return (-1, -1)
    last = upper_bound(nums, target) - 1
    return (first, last)`,
          cpp: `#include <vector>
#include <utility>
using namespace std;

// Lower Bound: first index i where nums[i] >= target (matches std::lower_bound)
int lowerBound(const vector<int>& nums, int target) {
    int low = 0;
    int high = static_cast<int>(nums.size()); // Half-open [low, high)
    while (low < high) {                      // Terminates when low == high
        int mid = low + (high - low) / 2;
        if (nums[mid] >= target) {
            high = mid;                       // Keep mid as potential leftmost answer
        } else {
            low = mid + 1;                    // Exclude mid
        }
    }
    return low;
}

// Upper Bound: first index i where nums[i] > target (matches std::upper_bound)
int upperBound(const vector<int>& nums, int target) {
    int low = 0;
    int high = static_cast<int>(nums.size());
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] > target) {             // Only difference from lowerBound: > vs >=
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return low;
}

// Returns {firstIdx, lastIdx} of target, or {-1, -1} if absent
pair<int, int> searchRange(const vector<int>& nums, int target) {
    int first = lowerBound(nums, target);
    if (first == static_cast<int>(nums.size()) || nums[first] != target) {
        return {-1, -1};
    }
    return {first, upperBound(nums, target) - 1};
}`,
          c: `// Lower Bound: first index in [0..n] with nums[i] >= target
int lowerBound(const int* nums, int n, int target) {
    int low = 0, high = n;              // Half-open [low, high)
    while (low < high) {                // Strictly < avoids infinite loop
        int mid = low + (high - low) / 2;
        if (nums[mid] >= target) {
            high = mid;                 // Retain mid as valid boundary
        } else {
            low = mid + 1;              // Discard left side
        }
    }
    return low;
}

// Upper Bound: first index in [0..n] with nums[i] > target
int upperBound(const int* nums, int n, int target) {
    int low = 0, high = n;
    while (low < high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] > target) {       // Strict > jumps past equal elements
            high = mid;
        } else {
            low = mid + 1;
        }
    }
    return low;
}

// Count occurrences of target in sorted array in O(log n)
int countTarget(const int* nums, int n, int target) {
    return upperBound(nums, n, target) - lowerBound(nums, n, target);
}`,
        },
        practiceFilterCategory: 'Binary Search',
      },
      {
        id: 'rotated-sorted-array',
        moduleId: 'binary-search',
        level: 'Intermediate',
        title: 'Search in Rotated Sorted Array',
        shortTitle: 'Rotated Sorted Array',
        subtitle:
          'Exploit the key invariant: cutting a rotated sorted array at `mid` ALWAYS leaves at least one half completely sorted.',
        summary:
          'Suppose a sorted array `[0, 1, 2, 4, 5, 6, 7]` is rotated at an unknown pivot into `[4, 5, 6, 7, 0, 1, 2]`. Even though the full array is not monotonic, splitting at ANY `mid` guarantees that either `[low..mid]` is strictly sorted (`arr[low] <= arr[mid]`) OR `[mid..high]` is strictly sorted. Check whether `target` sits inside the sorted half’s `[min, max]` range to decide which half to keep!',
        visual: {
          kind: 'binary-search',
          arrayValues: [4, 5, 6, 7, 0, 1, 2],
          targetLabel: 'Target = 0 (Pivot at index 4)',
          axisCaption: 'Rotated Sorted Array · Highlighted Bracket = Guaranteed Sorted Half',
          steps: computeRotatedSearchTrace([4, 5, 6, 7, 0, 1, 2], 0),
        },
        whenToUse: [
          'Searching a target in a sorted array shifted/rotated by an unknown offset `k`.',
          'Finding the Minimum Element (rotation pivot index) in a rotated sorted array.',
          'Circular log buffers or wrap-around timestamp arrays where one discontinuity exists.',
        ],
        commonPitfalls: [
          'Using strict `<` instead of `<=` in `if (nums[low] <= nums[mid])`: when only 2 elements remain (`low == mid`), `nums[low] == nums[mid]` MUST classify the left half `[low..mid]` as sorted, otherwise you misclassify and drop the target!',
          'Range boundary mistakes: on the sorted left half check `nums[low] <= target && target < nums[mid]`; on the sorted right half check `nums[mid] < target && target <= nums[high]`.',
          'Duplicates in Rotated Array (Search II): when `nums[low] == nums[mid] == nums[high]`, you cannot tell which side is sorted—shrink both ends (`low++`, `high--`), which degrades worst-case time from O(log n) to O(n).',
        ],
        complexityTable: [
          {
            operation: 'Rotated Search (Distinct Elements)',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Strictly halves search window on every iteration.',
          },
          {
            operation: 'Rotated Search (With Duplicates)',
            timeBest: 'O(1)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(n)',
            space: 'O(1)',
            notes: 'All-equal edge case like [2,2,2,3,2,2] forces linear shrinking.',
          },
          {
            operation: 'Find Minimum / Rotation Pivot',
            timeBest: 'O(log n)',
            timeAverage: 'O(log n)',
            timeWorst: 'O(log n)',
            space: 'O(1)',
            notes: 'Compare nums[mid] with nums[high] to converge on pivot.',
          },
        ],
        codeTemplates: {
          python: `from typing import List

def search_rotated(nums: List[int], target: int) -> int:
    low, high = 0, len(nums) - 1

    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] == target:                 # Immediate match
            return mid

        # Determine WHICH half is strictly sorted
        if nums[low] <= nums[mid]:              # <= is CRITICAL when low == mid!
            # Left half [low..mid] is sorted
            if nums[low] <= target < nums[mid]: # Target sits inside sorted left half
                high = mid - 1
            else:                               # Target must be in right half
                low = mid + 1
        else:
            # Right half [mid..high] is sorted
            if nums[mid] < target <= nums[high]:# Target sits inside sorted right half
                low = mid + 1
            else:                               # Target must be in left half
                high = mid - 1

    return -1                                   # Not found`,
          cpp: `#include <vector>
using namespace std;

// Search in Rotated Sorted Array (Distinct Values): O(log n) time, O(1) space
int searchRotated(const vector<int>& nums, int target) {
    int low = 0;
    int high = static_cast<int>(nums.size()) - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;

        // Check if left half [low..mid] is sorted
        if (nums[low] <= nums[mid]) {           // Must use <= to handle 2-element window
            if (nums[low] <= target && target < nums[mid]) {
                high = mid - 1;                 // Target lies inside sorted left half
            } else {
                low = mid + 1;                  // Otherwise pivot to right half
            }
        } else {
            // Right half [mid..high] is guaranteed sorted
            if (nums[mid] < target && target <= nums[high]) {
                low = mid + 1;                  // Target lies inside sorted right half
            } else {
                high = mid - 1;                 // Otherwise pivot to left half
            }
        }
    }
    return -1;
}`,
          c: `// Search in Rotated Sorted Array: O(log n) time, O(1) space
int searchRotated(const int* nums, int n, int target) {
    int low = 0, high = n - 1;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;

        if (nums[low] <= nums[mid]) {           // Left half [low..mid] is sorted
            if (nums[low] <= target && target < nums[mid]) {
                high = mid - 1;                 // Target inside sorted left range
            } else {
                low = mid + 1;                  // Discard left half
            }
        } else {                                // Right half [mid..high] is sorted
            if (nums[mid] < target && target <= nums[high]) {
                low = mid + 1;                  // Target inside sorted right range
            } else {
                high = mid - 1;                 // Discard right half
            }
        }
    }
    return -1;
}`,
        },
        practiceFilterCategory: 'Binary Search',
      },
      {
        id: 'binary-search-answer-space',
        moduleId: 'binary-search',
        level: 'Advanced',
        title: 'Binary Search on Answer Space (Monotonic Predicate)',
        shortTitle: 'Binary Search on Answer',
        subtitle:
          'Solve optimization problems ("minimize the maximum" / "maximize the minimum") by binary searching over candidate answers instead of array indices.',
        summary:
          'Many hard optimization problems do NOT give you a sorted array—instead, the space of possible ANSWERS `[minAns, maxAns]` is monotonic! If a helper function `feasible(x)` produces `[False, False, ..., False, True, True, ...]` (e.g., Koko Eating Bananas, Ship Packages Within D Days, Allocate Books), you can binary search for the exact transition boundary in O(log(Range) × cost(feasible)).',
        visual: {
          kind: 'binary-search',
          arrayValues: [1, 2, 3, 4, 5, 6, 7, 8],
          targetLabel: 'Minimize Speed k · Piles=[3,6,7,11], H=8h (Optimal k=4)',
          axisCaption: 'Candidate Answer Space k ∈ [1..8] · Monotonic Predicate F → T',
          isAnswerSpace: true,
          steps: computeAnswerSpaceTrace([1, 2, 3, 4, 5, 6, 7, 8], 4),
        },
        whenToUse: [
          'Prompt asks to "Minimize the maximum..." (Capacity to Ship Packages, Split Array Largest Sum, Koko Eating Bananas).',
          'Prompt asks to "Maximize the minimum..." (Aggressive Cows, Magnetic Force Between Two Balls).',
          'Checking whether a specific guessed answer `x` works (`canAchieve(x)`) is easy in O(n), and feasibility is monotonic (if `x` works, every larger/smaller value also works).',
          'Answer bounds are large (up to 10⁹ or 10¹⁸), where O(n) linear search over answers would TLE, while O(n log(maxVal)) passes easily.',
        ],
        commonPitfalls: [
          'Wrong initial bounds `[low, high]`: setting `low = 0` when dividing by speed `mid` causes ZeroDivisionError! Always pick mathematically tight, safe bounds (e.g., `low = max(weights)` for Ship Packages, `low = 1` for Koko speed).',
          'Infinite loop when maximizing (`TTTTFFFF` pattern): if you keep `mid` on the left (`low = mid`), standard floor `mid = low + (high - low) / 2` loops forever when `high == low + 1`! Use UPPER midpoint `mid = low + (high - low + 1) / 2` whenever doing `low = mid`.',
          'Integer overflow inside `feasible(mid)` accumulator: summing capacities or computing `mid * mid` can exceed 32-bit `int` in C/C++—use `long long` for `low`, `high`, and accumulators.',
          'Applying ceiling division incorrectly: `ceil(p / k)` with integers is `(p + k - 1) / k` (avoid floating-point precision loss!).',
        ],
        complexityTable: [
          {
            operation: 'Minimize Feasible Answer (F→T)',
            timeBest: 'O(n log R)',
            timeAverage: 'O(n log R)',
            timeWorst: 'O(n log R)',
            space: 'O(1)',
            notes: 'R = high - low (answer range); n = cost of feasible(mid) scan.',
          },
          {
            operation: 'Maximize Feasible Answer (T→F)',
            timeBest: 'O(n log R)',
            timeAverage: 'O(n log R)',
            timeWorst: 'O(n log R)',
            space: 'O(1)',
            notes: 'Use upper midpoint (low + (high - low + 1) / 2) to prevent infinite loop.',
          },
          {
            operation: 'Continuous Answer Space (Double)',
            timeBest: 'O(n log(R/ε))',
            timeAverage: 'O(n · 100)',
            timeWorst: 'O(n · 100)',
            space: 'O(1)',
            notes: 'Run fixed 60–100 iterations instead of while(high-low > eps) to avoid float stall.',
          },
        ],
        codeTemplates: {
          python: `from typing import List

# Example: Koko Eating Bananas — Minimize eating speed k to finish within h hours
def min_eating_speed(piles: List[int], h: int) -> int:
    # Monotonic Predicate: if speed k works (True), every speed > k also works (True)
    def can_finish(speed: int) -> bool:
        hours_needed = 0
        for pile in piles:
            hours_needed += (pile + speed - 1) // speed  # Exact integer ceil(pile / speed)
        return hours_needed <= h

    low = 1                               # Minimum valid speed (never 0 -> avoids ZeroDivision)
    high = max(piles)                     # Maximum useful speed (1 hour per pile)

    while low < high:                     # Converge on FIRST True in [F, F, ..., T, T]
        mid = low + (high - low) // 2     # Lower midpoint safe because high = mid, low = mid + 1
        if can_finish(mid):
            high = mid                    # mid works; try even smaller speeds
        else:
            low = mid + 1                 # mid too slow; strictly discard <= mid

    return low                            # low == high is the minimum feasible speed`,
          cpp: `#include <vector>
#include <algorithm>
using namespace std;

// Helper predicate: O(n) check if eating speed k finishes all piles within h hours
bool canFinish(const vector<int>& piles, long long speed, long long h) {
    long long hours = 0;
    for (int pile : piles) {
        hours += (pile + speed - 1) / speed; // Integer ceil division; avoids float error
    }
    return hours <= h;
}

// Binary Search on Answer Space: O(n log(maxPile)) time, O(1) space
int minEatingSpeed(const vector<int>& piles, int h) {
    long long low = 1;                       // Use 64-bit to avoid overflow on large ranges
    long long high = *max_element(piles.begin(), piles.end());

    while (low < high) {                     // Find first True in monotonic F..F T..T
        long long mid = low + (high - low) / 2;
        if (canFinish(piles, mid, h)) {
            high = mid;                      // Feasible -> keep mid and shrink right
        } else {
            low = mid + 1;                   // Infeasible -> discard [low..mid]
        }
    }
    return static_cast<int>(low);            // Minimum feasible speed
}`,
          c: `#include <stdbool.h>

// Monotonic feasibility check: O(n)
bool canFinish(const int* piles, int n, long long speed, long long h) {
    long long hours = 0;
    for (int i = 0; i < n; i++) {
        hours += (piles[i] + speed - 1) / speed; // Exact integer ceiling
    }
    return hours <= h;
}

// Binary Search on Answer Space: O(n log(maxPile)) time, O(1) space
int minEatingSpeed(const int* piles, int n, int h) {
    long long low = 1;
    long long high = piles[0];
    for (int i = 1; i < n; i++) {
        if (piles[i] > high) high = piles[i];    // Tight upper bound = max(piles)
    }

    while (low < high) {                         // First True in [F, F, ..., T, T]
        long long mid = low + (high - low) / 2;  // Overflow-safe midpoint
        if (canFinish(piles, n, mid, h)) {
            high = mid;                          // Candidate works; search smaller
        } else {
            low = mid + 1;                       // Too slow; search larger
        }
    }
    return (int)low;
}`,
        },
        practiceFilterCategory: 'Binary Search',
      },
    ],
  },
];

export function getConceptModuleById(id: ConceptModuleId): ConceptModule {
  return (
    DSA_CONCEPT_MODULES.find((m) => m.id === id) || DSA_CONCEPT_MODULES[0]
  );
}
