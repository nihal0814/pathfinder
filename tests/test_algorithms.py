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

    def test_dfs_follows_depth_first_order_across_cross_links(self):
        walls = [
            [4, 4], [2, 4], [2, 1], [1, 5], [4, 2], [4, 5],
            [3, 3], [1, 0], [2, 5], [4, 1], [3, 5],
        ]
        result = search_path(6, 6, walls, [0, 0], [5, 5], "dfs")
        self.assertTrue(result["found"])
        self.assertEqual(
            result["visited_order"],
            [
                [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
                [1, 4], [1, 3], [2, 3], [2, 2], [1, 2], [1, 1],
                [3, 2], [3, 1], [3, 0], [2, 0], [4, 0], [5, 0],
                [5, 1], [5, 2], [5, 3], [4, 3], [5, 4], [5, 5],
            ],
        )

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
