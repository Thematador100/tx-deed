"""
Property valuation model using machine learning
Predicts property values based on features
"""

import logging
import pickle
from typing import Dict, List, Optional, Tuple
import json


class PropertyValuationModel:
    """ML model for property valuation"""

    def __init__(self, model_path: Optional[str] = None):
        """
        Initialize valuation model

        Args:
            model_path: Path to saved model file
        """
        self.logger = logging.getLogger("property_valuation")
        self.model = None
        self.scaler = None
        self.feature_names = [
            'bedrooms', 'bathrooms', 'square_feet', 'lot_size',
            'year_built', 'latitude', 'longitude'
        ]

        if model_path:
            self.load_model(model_path)

    def prepare_features(self, property_data: Dict) -> Optional[List[float]]:
        """
        Prepare feature vector from property data

        Args:
            property_data: Property dictionary

        Returns:
            Feature vector or None if missing required features
        """
        features = []

        for feature_name in self.feature_names:
            value = property_data.get(feature_name)

            if value is None:
                # Handle missing values
                if feature_name == 'lot_size':
                    value = 0  # Unknown lot size
                elif feature_name == 'latitude' or feature_name == 'longitude':
                    value = 0  # Unknown location
                else:
                    # Required feature missing
                    self.logger.warning(f"Missing required feature: {feature_name}")
                    return None

            features.append(float(value))

        return features

    def train(self, properties: List[Dict]):
        """
        Train the valuation model

        Args:
            properties: List of properties with known prices
        """
        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.preprocessing import StandardScaler
            from sklearn.model_selection import train_test_split
            from sklearn.metrics import mean_absolute_error, r2_score
        except ImportError:
            self.logger.error("scikit-learn not installed. Cannot train model.")
            return

        # Prepare training data
        X = []
        y = []

        for prop in properties:
            features = self.prepare_features(prop)
            price = prop.get('price')

            if features and price:
                X.append(features)
                y.append(price)

        if len(X) < 10:
            self.logger.error("Insufficient training data (need at least 10 samples)")
            return

        self.logger.info(f"Training model with {len(X)} samples")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model
        self.model = RandomForestRegressor(
            n_estimators=100,
            max_depth=20,
            min_samples_split=5,
            random_state=42,
            n_jobs=-1
        )

        self.model.fit(X_train_scaled, y_train)

        # Evaluate
        train_predictions = self.model.predict(X_train_scaled)
        test_predictions = self.model.predict(X_test_scaled)

        train_mae = mean_absolute_error(y_train, train_predictions)
        test_mae = mean_absolute_error(y_test, test_predictions)
        train_r2 = r2_score(y_train, train_predictions)
        test_r2 = r2_score(y_test, test_predictions)

        self.logger.info(f"Training MAE: ${train_mae:,.2f}, R²: {train_r2:.3f}")
        self.logger.info(f"Testing MAE: ${test_mae:,.2f}, R²: {test_r2:.3f}")

        # Feature importance
        feature_importance = dict(zip(self.feature_names, self.model.feature_importances_))
        self.logger.info(f"Feature importance: {feature_importance}")

    def predict(self, property_data: Dict) -> Optional[Dict]:
        """
        Predict property value

        Args:
            property_data: Property dictionary

        Returns:
            Prediction dictionary with estimated value
        """
        if not self.model:
            self.logger.error("Model not trained or loaded")
            return None

        features = self.prepare_features(property_data)

        if not features:
            return None

        try:
            from sklearn.preprocessing import StandardScaler
        except ImportError:
            self.logger.error("scikit-learn not installed")
            return None

        # Scale features
        features_scaled = self.scaler.transform([features])

        # Predict
        predicted_value = self.model.predict(features_scaled)[0]

        # Calculate confidence interval (simplified)
        # In production, use prediction intervals from the model
        confidence_range = predicted_value * 0.1  # ±10%

        return {
            'estimated_value': round(predicted_value, 2),
            'confidence_range': {
                'low': round(predicted_value - confidence_range, 2),
                'high': round(predicted_value + confidence_range, 2)
            },
            'features_used': dict(zip(self.feature_names, features))
        }

    def predict_bulk(self, properties: List[Dict]) -> List[Dict]:
        """
        Predict values for multiple properties

        Args:
            properties: List of property dictionaries

        Returns:
            List of properties with predictions added
        """
        results = []

        for prop in properties:
            prediction = self.predict(prop)

            if prediction:
                prop['valuation_prediction'] = prediction
                results.append(prop)

        self.logger.info(f"Generated predictions for {len(results)} properties")

        return results

    def save_model(self, filepath: str):
        """Save trained model to file"""
        if not self.model:
            self.logger.error("No model to save")
            return

        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names
        }

        with open(filepath, 'wb') as f:
            pickle.dump(model_data, f)

        self.logger.info(f"Model saved to {filepath}")

    def load_model(self, filepath: str):
        """Load trained model from file"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)

            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']

            self.logger.info(f"Model loaded from {filepath}")

        except FileNotFoundError:
            self.logger.error(f"Model file not found: {filepath}")
        except Exception as e:
            self.logger.error(f"Error loading model: {str(e)}")

    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance scores"""
        if not self.model:
            return {}

        return dict(zip(self.feature_names, self.model.feature_importances_))

    def compare_to_market(self, property_data: Dict, comparable_properties: List[Dict]) -> Dict:
        """
        Compare predicted value to market comparables

        Args:
            property_data: Property to value
            comparable_properties: List of comparable properties

        Returns:
            Comparison results
        """
        prediction = self.predict(property_data)

        if not prediction:
            return {}

        # Get comparable prices
        comp_prices = [p['price'] for p in comparable_properties if p.get('price')]

        if not comp_prices:
            return prediction

        import statistics

        avg_comp_price = statistics.mean(comp_prices)
        median_comp_price = statistics.median(comp_prices)

        predicted_value = prediction['estimated_value']

        return {
            **prediction,
            'market_comparison': {
                'avg_comparable_price': round(avg_comp_price, 2),
                'median_comparable_price': round(median_comp_price, 2),
                'difference_from_avg': round(predicted_value - avg_comp_price, 2),
                'difference_percent': round(
                    ((predicted_value - avg_comp_price) / avg_comp_price) * 100, 2
                ),
                'num_comparables': len(comp_prices)
            }
        }
