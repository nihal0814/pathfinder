import unittest
from backend.app.algorithms import search_path

class SearchAlgorithmTests(unittest.TestCase):
    def test_bfs_shortest_path_open_grid(self):
        result = search_path(5, 5, [], [0, 0], [4, 4], "bfs")
        self.assertTrue(result["found"])
        self.assertEqual(result["path_length"], 8)

    def test_astar_shortest_path_open_grid(self):
        result = search_path(5, 5, [], [0, 0], [4, 4], "astar")
        self.assertTrue(result["found"])
        self.assertEqual(result["path_length"], 8)

    def test_no_path(self):
        walls = [[1, 0], [1, 1], [1, 2], [1, 3]]
        result = search_path(4, 4, walls, [0, 0], [2, 0], "bfs")
        self.assertFalse(result["found"])
        self.assertEqual(result["path"], [])

    def test_start_equals_end(self):
        result = search_path(4, 4, [], [2, 2], [2, 2], "astar")
        self.assertTrue(result["found"])
        self.assertEqual(result["path_length"], 0)

    def test_invalid_algorithm(self):
        with self.assertRaises(ValueError):
            search_path(4, 4, [], [0, 0], [3, 3], "ucs")

if __name__ == "__main__":
    unittest.main()
