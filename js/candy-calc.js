//
// @file 			candy-calc.js
// @author 			Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
// @edited 			n/a
// @date 			2013-11-01
// @last-modified	2015-06-22
// @brief 			Binding/calculating code for candy-calc.
// @details
//		See the README in the repo root dir for more info.

// Debug flag. Set to true to print debug information, otherwise false.
var DEBUG = false;

// Load jQuery if not already loaded	
window.jQuery || document.write('<script src="http://code.jquery.com/jquery-latest.min.js"><\/script>');

// Load knockout for binding functionality
document.write('<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/knockout/2.3.0/knockout-min.js"></script>');

// Load knockout plugin "knockout-deferred-updates".
// This is stored under 'lib/'' in the candy-calc repo
document.write('<script type="text/javascript" src="/lib/candy-calc/lib/knockout-deferred-updates/knockout-deferred-updates.js"></script>');

// Load knockout plugin "knockout-postbox"
// This is stored under 'lib/'' in the candy-calc repo
document.write('<script type="text/javascript" src="/lib/candy-calc/lib/knockout-postbox/src/knockout-postbox.js"></script>');

// MathJax for Latex rendering
document.write('<script type="text/javascript" src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>');

// Load qTip

// CSS file
document.write('<link type="text/css" rel="stylesheet" href="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.1.1/jquery.qtip.min.css" />');
// JS. Include either the minifed or production version, not both
document.write('<script type="text/javascript" src="http://cdnjs.cloudflare.com/ajax/libs/qtip2/2.1.1/jquery.qtip.min.js"></script>');


//! @brief		Candy-calc "namespace"
//! @details	All candy-calc framework should be inside this
var cc = new function()
{
	//! @brief		Enumeration of pre-defined validators.
	//! @details	Pass these into the "this.<your cc.variable object>.AddValidator()" function.
	this.validatorEnum = {
		'IS_NUMBER' 			: 1,	//!< Variable must be a valid number
		'IS_POSITIVE_OR_ZERO' 	: 2,	//!< Variable must be positive or zero.
		'IS_NEGATIVE_OR_ZERO' 	: 3 	//!< Variable must be negative or zero.
	}
	
	//! @brief		Enumeration of severity levels for validators. Severity level
	//! 			determines background colour of variable.
	this.severityEnum = {
		'ok'					: 0,
		'warning' 				: 1,
		'error' 				: 2
	}
	
	//! @brief		Used to determine whether variable is an input or an output
	this.stateEnum = {
		'input'					: 1,
		'output'					: 2
	}
	
	//! @brief		Calculator unit object
	this.unit = function(name, multiplier) {
			  this.name = name;
			  this.multiplier = multiplier;
	};
	
	//! @brief		"Class" for validator object, which is created everytime you add a validator to a calculator variable.
	//! @param		app 		The application object, so the validator function can access other variables in the calculator.
	//! @param		msg 		The message to display to the user if the validator returns false.
	//! @param		fn 			The function which performs the validation. The function must return true if value is o.k., otherwise false.
	//! @param		severity 	The severity if the validation fails.
	this.validator = function(app, msg, fn, severity)
	{
		this.app = app;
		this.msg = msg;
		this.fn = fn;	
		this.severity = severity;
	}
	
	// @brief	This function is used to link units together.
	//! @param	calcVar 	The variable you wish to link.
	//! @param	topic 		A keyword which is the same across multiple units you wish to link together.
	this.linkUnits = function(calcVar, topic)
	{		
		// Uses the postbox plugin to register with a topic
		calcVar.selUnit.syncWith(topic);
	}
	
	//! @brief	Registers a calculator so that the bindings will be applied when the page is 
	// 			loaded.
	//! @param 	viewModel	The 'class' which contains all of the view model
	//! @param	htmlId		The HTML ID (string) which contains all of the view model
	//! @example	cc.registerCalc(smpsBuckConverter, 'smpsBuckConverter');
	this.registerCalc = function(viewModel, htmlId)
	{
		// Start-up function
		jQuery(document).ready(
			function StartUp()
			{	  		
				// Activates knockout.js for a particular HTML object only	
				ko.applyBindings(new viewModel, document.getElementById(htmlId));	
			}
		);
	}
	
	

	//! @brief		Converts a number into a string with engineering notation (i.e. using the suffixes u, m, k, M e.t.c).
	//! @param		number 		The number you wish to convert into a engineering notated string.
	this.ToEngNotation = function(number)
	{

		//! @brief	This variable maps the multiplier to the symbol that is used as a suffix to a number.
	    var unitMap = {
	    	1e-24:'y', 1e-21:'z', 1e-18:'a', 1e-15:'f', 1e-12:'p', 1e-9:'n', 1e-6:'u', 1e-3:'m',
	    	1e0:'',
	    	1e3:'k', 1e6:'M', 1e9:'G', 1e12:'T', 1e15:'P', 1e18:'E', 1e21:'Z', 1e24:'Y'};

		var space = '&thinsp;';

		var numLog10 = this.Log10(number);
		//console.log("numLog10 = '" + numLog10 + "'.");

		var numDiv3 = numLog10 / 3;
		//console.log("numDiv3 = '" + numDiv3 + "'.");

		var numDiv3Floor = Math.floor(numDiv3);
		//console.log("numDiv3Floor = '" + numDiv3Floor + "'.");

		var closestUnitAsNumber = Math.pow(1000, numDiv3Floor);
		//console.log("closestUnitAsNumber = '" + closestUnitAsNumber + "'.");

		// Now lets find the symbol for the closest engineering suffix, using
		// the unitMap
		closestUnitAsSymbol = unitMap[closestUnitAsNumber];
		//console.log("closestUnitAsSymbol = '" + closestUnitAsSymbol + "'.");

		result = number/closestUnitAsNumber + closestUnitAsSymbol;
		//console.log("result = '" + result + "'.");

		return result;
	}
	
	// Function calculates the base-10 log of the given input
	this.Log10 = function(val)
	{
		// Use rule log10(x) = ln(x)/ln(10)
		return Math.log(val) / Math.LN10;
	}

	//! @brief		This is a calculator variable that can act as both an input and an output.
	//! @param		obj Contains all the setup data.
	//!					obj.name 	The name of the variable, used for debugging purposes only.
	//!					obj.units 	The available units for the variable.
	//!					obj.selUnit 	The default unit for the variable. 0-indexed. Must not be greater than
	//!									the number of objects passed into obj.units.
	this.variable = function(obj)
	{
			
		//! @brief		Save the name for debugging purposes
		this.name = obj.name;

		//========= UNITS =========//
			
		//! @brief		Available units for this variable. This does not need 2 seperate values.
		this.units = ko.observableArray(obj.units);
		
		//! @brief		The selected unit for this variable
		this.selUnit = ko.observable(this.units()[obj.selUnitNum]);
		
		// This value is the actual value, stored in the background. dispVal is what the
		// user sees. This is always in SI without any unit postfix.
		// (e.g. V, Hz, never mV, kHz or MHz)
		this.val = ko.observable();
		
		this.app = obj.app;		
				
		// This determines whether the variable is an input or an output
		this.state = ko.computed(obj.stateFn, obj.app);
		
		// This is the value that the user sees. It modifies the actual value, variable.val, 
		// which is kept in the background
		this.dispVal = ko.computed({
			read: function () {

				Log('variable.dispVal.read() called for ' + this.name + '.');

				if(this.state() == cc.stateEnum.output)
				{					
					

					Log('Calculating and writing to underlying variable.');
					// Calculate the value based on the provided
					// equation
					var value = obj.eqFn.call(obj.app);
					
					// Storing
					Log('Storing "' + value + '" in this.val.');
					this.val(value);
					
					
					// Scale value
					value = value/this.selUnit().multiplier
					
					// Now round it
					value = Math.round(value*Math.pow(10, this.roundTo))/Math.pow(10, this.roundTo);
					
					// If this variable hasn't been initialised yet, return blank
					if(this.dispVal == null)
					{
						return '';
					}
					else
					{
						// Make sure dependencies are valid
						for(x = 0; x < this.dispVal.getDependencies().length; x++)
						{
							depVar = this.dispVal.getDependencies()[x]();
							
							if((typeof depVar == 'undefined'))
							{
								Log('A value is still blank!');
								return '';
							}
							if((isNaN(depVar)) && (typeof depVar == 'number'))
							{
								Log('Thing is NaN and not an object!');
								return '';
							}
						}
						
						// If code reaches here then all dependencies are valid
						return value;
					}
				}
				else
				{
					Log('Reading from underlying variable ("' + this.val() + '").');
					
					var value = this.val();

					// We need to check so see whether it is a valid number
					if(!isNaN(value) && !(value == ''))
					{
						Log('Value is a valid number.');
									// Scale it
						value = value/this.selUnit().multiplier
						
						// Now round it
						value = Math.round(value*Math.pow(10, this.roundTo))/Math.pow(10, this.roundTo);
						
						if(isNaN(value))
							return '';
						else
							return value;
					}
					else
					{
						// Value is NaN, so just write it directly
						Log('value is NaN, so returning value directly.');					
						return value;
					}
					
				}
			},
			write: function (value) {
				Log('variable.dispVal.write() called for ' + this.name + '.');
				Log('value = ' + value);

				// We need to check so see whether it is a valid number or empty!
				if(!isNaN(value) && !(value == ''))
				{
					Log('Writing ' + value*this.selUnit().multiplier + ' to underlying variable');
					this.val(value*this.selUnit().multiplier);
				}
				else
				{
					// Value is NaN, so just write it directly
					Log('value is NaN or empty, so writing value directly to underlying variable.');					
					this.val(value);
				}
			},
			owner: this
		}); // this.dispVal = ko.computed({
		
		// Number of decimal places to round value to
		if(obj.roundTo != null)
			this.roundTo = obj.roundTo;
		else
			this.roundTo = 1;		
		
		this.lowerBound = 0; //ko.observable(lowerBound);
		this.upperBound = 0; //ko.observable(upperBound);

		// Holds all validator functions
		this.validatorA = ko.observableArray();
		
		this.trigIndex = ko.observable();
		
		//! @brief		Use to determine if variable value is valid.
		//! @details	Also modifies this.trigIndex().
		this.isValid = ko.computed(
			function()
			{
				Log('variable.isValid() called for ' + this.name + '.');
				Log('Computing isValid for output.');
				Log('Validator array length = ' + this.validatorA().length);
				for (var i = 0; i < this.validatorA().length; i++) {
					if(this.validatorA()[i].fn(this.validatorA()[i].app) == false)
					{
						// Remember the validator which returned false
						//this.triggeredValidator(this.validatorA()[i]);
						Log('Setting index.');
						this.trigIndex(i);
						Log('Returning false.');
						return false;
					}
				}
				// Only gets here if no validator function returned false
				Log('Returning true.');
				return true;
			},
			this
		);
				
		//========================= METHODS =========================

		//! @brief		Call this to add a validator for the variable value.
		//! @details	
		//! @param	validatorEnum	The type of validator you are adding.
		//! @param	severity 		The severity of the validator.
		this.AddValidator = function(validatorEnum, severity)
		{
			switch(validatorEnum)
			{
				case cc.validatorEnum.IS_NUMBER:
					Log('Adding IS_NUMBER validator.');
					this.validatorA.push(
						new cc.validator(
							this,
							'Value must be a number!',
							function(variable)
							{
								Log('Testing ' + variable.val());
								return jQuery.isNumeric(variable.val());
							}, 
							severity)
					);
					break;
				case cc.validatorEnum.IS_NEGATIVE_OR_ZERO:
					Log('Adding IS_NEGATIVE_OR_ZERO validator.');
					this.validatorA.push(
						new cc.validator(
							this,
							'Value must be negative or zero!',
							function(variable)
							{								
								return variable.val() <= 0;
							}, 
							severity)
					);
					break;
				case cc.validatorEnum.IS_POSITIVE_OR_ZERO:
					Log('Adding IS_POSITIVE_OR_ZERO validator.');
					this.validatorA.push(
						new cc.validator(
							this,
							'Value must be positive or zero!',
							function(variable)
							{								
								return variable.val() >= 0;
							}, 
							severity)
					);
					break;
				default:
					console.log('ERROR: Enum not recognised.');
			}
		}

		//! @brief		Adds a custom validator to the calculator variable.
		//! @param		app
		//! @param		msg 		The message you want to display in the tooltip if the validator fails.
		//! @param		fn 			The function which performs the validation. Must return true if value is o.k., 
		//! 						otherwise false.
		//! @param		severity 	The severity of the validation. Must be a member of the cc.severityEnum enumeration.
		this.AddCustomValidator = function(app, msg, fn, severity)
		{
			// Create new validator object and add to the end of the array
			this.validatorA.push(new cc.validator(app, msg, fn, severity));
		}

				
	};
};

//! @brief		Stuff to execute on start-up
//! @details	Register custom binding handlers.
jQuery(document).ready(
	function StartUp()
	{	  		
		//! @brief		Custom "calcVar" binding.
		ko.bindingHandlers.calcVar = {
			init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
				// This will be called when the binding is first applied to an element
				// Set up any initial state, event handlers, etc. here						
				
				// Call value binding (child binding)
				ko.bindingHandlers.value.init(
					element,
					function (){ return valueAccessor().dispVal } ,
					allBindings,
					viewModel,
					bindingContext);
				  
				// Create Opentip (tooltip) for input box
				Log('Initialising calculator variable handlers');			
								
			 },
			update: function(element, valueAccessor, allBindings, viewModel, bindingContext)
			{
				// This will be called once when the binding is first applied to an element,
				// and again whenever the associated observable changes value.
				// Update the DOM element based on the supplied values here.

				// valueAccessor() can be used to access the cc.variable() object
		
				// Call value binding (child binding)
				ko.bindingHandlers.value.update(
					element,
					function (){ return valueAccessor().dispVal },
					allBindings,
					viewModel,
					bindingContext);
				  						
			  	Log('ko.bindingHandlers.calcVar.update() called for ' + valueAccessor().name + '.');

			  	// VARIABLE VALUE VALIDATION

			  	// Lets assume variable is o.k. by default, worstSeverity will be overwritten
			  	// by any higher severities (ok == 0).
			  	var worstSeverity = cc.severityEnum.ok;

			  	// Lets iterate through all validators, and find if the variable fails validation, and what the worst severity is
			  	for (var i = 0; i < valueAccessor().validatorA().length; i++) {
			  		// Call the validator function, passing in the application object as an input variable
					if(valueAccessor().validatorA()[i].fn(valueAccessor().validatorA()[i].app) == false)
					{
						if(worstSeverity < valueAccessor().validatorA()[i].severity)
						{
							worstSeverity = valueAccessor().validatorA()[i].severity;
						}
					}
				}

				//console.log("worstSeverity = '" + worstSeverity + "'.");

				// Now we know what the worst severity is, lets iterate back through and make up an message (in list format) of all the validators
				// with that severity AND fail validation

				var failedValidatorString = "<ul>";

				for (var i = 0; i < valueAccessor().validatorA().length; i++) {
					if(valueAccessor().validatorA()[i].severity == worstSeverity)
					{
						if(valueAccessor().validatorA()[i].fn(valueAccessor().validatorA()[i].app) == false)
						{
							// Validator is off the worst severity for this calculator variable and failed test, lets add to message
							failedValidatorString += "<li>";
							failedValidatorString += valueAccessor().validatorA()[i].msg;
							failedValidatorString += "</li>";
						}
					}
				}

				failedValidatorString += "</ul>";
				
				//console.log("failedValidatorString = '" + failedValidatorString + "'.");

				if(worstSeverity == cc.severityEnum.ok)
				{
					Log('Removing notValid class and disabling tooltip1.');
					// Remove notValid class to make green again
					jQuery(element).removeClass("warning");
					jQuery(element).removeClass("error");
					jQuery(element).addClass("ok");
					// Disable tooltip which showed any errors
					//jQuery(element).qtip('disable', true);
					jQuery(element).qtip('destroy',true)
				}
				else if(worstSeverity == cc.severityEnum.warning) // if(worstSeverity == cc.severityEnum.ok)
				{
					Log('Severity == cc.severityEnum.warning.');
						jQuery(element).removeClass("ok");
						jQuery(element).removeClass('error'); 
						jQuery(element).addClass('warning'); 	
						
						jQuery(element).qtip({
							content: {
								// Grab the text shown the the triggered validator object
								//text: valueAccessor().validatorA()[valueAccessor().trigIndex()].msg,
								text: failedValidatorString,
								title: 'Warning!'
							},
							style: {
								 classes: 'qTipWarning qtip-rounded qtip-shadow',								   
							},
							show: {
								effect: function(offset) {
									jQuery(this).slideDown(100); // "this" refers to the tooltip
								}
							},
							hide: {
								effect: function(offset) {
									jQuery(this).slideDown(100); // "this" refers to the tooltip
								}
							}
						});
				}
				else if(worstSeverity == cc.severityEnum.error) // if(worstSeverity == cc.severityEnum.ok)
				{
					Log('Severity == cc.severityEnum.error.');
					jQuery(element).removeClass("warning");
					jQuery(element).removeClass("ok");
					jQuery(element).addClass('error'); 
					
					jQuery(element).qtip({
						content: {
							// Grab the text shown the the triggered validator object
							//text: valueAccessor().validatorA()[valueAccessor().trigIndex()].msg,
							text: failedValidatorString,
							title: 'Error!'
						},
						style: {
							classes: 'qTipError qtip-rounded qtip-shadow'
						},
						show: {
							effect: function(offset) {
								jQuery(this).slideDown(100); // "this" refers to the tooltip
							}
						},
						hide: {
							effect: function(offset) {
								jQuery(this).slideDown(100); // "this" refers to the tooltip
							}
						}
					}); // jQuery(element).qtip({
				}
				else // if(worstSeverity == cc.severityEnum.ok)
				{
					Log('ERROR: Severity not valid!');
				}
			}
		};
		
		//! @brief		Here's a custom Knockout binding that makes elements shown/hidden via jQuery's fadeIn()/fadeOut() methods.
		//! @details	Use instead of the "visible" binding if you want to add fade animation.
		ko.bindingHandlers.fadeVisible = {
		    init: function(element, valueAccessor) {
		        // Initially set the element to be instantly visible/hidden depending on the value
		        var value = valueAccessor();
		        jQuery(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
		    },
		    update: function(element, valueAccessor) {
		        // Whenever the value subsequently changes, slowly fade the element in or out
		        var value = valueAccessor();
		        ko.unwrap(value) ? jQuery(element).fadeIn() : jQuery(element).fadeOut();
		    }
		};
	
	}
);

//! @brief		Logs error messages.
//! @details	Error messages can be turned on and off by setting DEBUG.
function Log(msg)
{
	// Only print if DEBUG variable has been set to true
	if(DEBUG == true)
		console.log(msg);
}


//=============================================================================================================//
//============================================== GRAVEYARD ====================================================//
//=============================================================================================================//

/* Moved to graveyard on 2015-06-20
//! @brief		"Class" for a calcultor input variable.
	this.input = function(app, validatorFn, units, selUnit) {

		//! @brief		The displayed value for the variable
		this.dispVal = ko.observable();

		//! @biref		Array of the available units for the variable.
		this.units = ko.observableArray(units);

		//! @brief		The currently selected unit for the array of available units.
		this.selUnit = ko.observable(this.units()[selUnit]);
		
		//! @brief		Hidded, actual and scaled value, taking into account the units.
		this.val = ko.computed( function(){
			return this.dispVal()*this.selUnit().multiplier;
			},
			this);

		//! @brief		Holds all validator functions.
		this.validatorA = ko.observableArray();
		
		this.trigIndex = ko.observable();
		
		//! @brief		Runs through all the validator functions
		//! @details	Default is to just return true.
		this.isValid = ko.computed(
			function()
			{
				Log('Computing isValid for input.');
				Log('Validator array length = ' + this.validatorA().length);
				for (var i = 0; i < this.validatorA().length; i++) {
					if(this.validatorA()[i].fn(this.validatorA()[i].app) == false)
					{
						// Remember the validator which returned false
						Log('Setting index.');
						this.trigIndex(i);
						Log('Returning false.');
						return false;
					}
				}
				// Only gets here if no validator function returned false 
				// (or there were no validator functions)
				Log('Returning true.');
				return true;
			},
			this
		);
		
		//========================= Methods =========================//
	
		//! @brief		Call this to add a validator for the variable.
		//! @details
		//! @param	validatorEnum	The type of validator you are adding.
		//! @param	severity 		The severity of the validator.
		this.AddValidator = function(validatorEnum, severity)
		{
			switch(validatorEnum)
			{
				case cc.validatorEnum.IS_NUMBER:
					Log('Adding IS_NUMBER validator.');
					this.validatorA.push(
						new cc.validator(
							this,
							'Value must be a number!',
							function(variable)
							{
								Log('Testing ' + variable.val());
								return jQuery.isNumeric(variable.val());
							}, 
							severity)
					);
					break;
				//case default:
					//console.log('Enum not recognised.');
			}
		}
		
		this.AddCustomValidator = function(app, msg, fn, severity)
		{
			// Create new validator object and add to the end of the array
			Log('Adding new custom validator.');
			this.validatorA.push(new cc.validator(app, msg, fn, severity));
		}
		
		
   }; // this.input
	
	//! @brief		"Class" for a calcultor output variable.
	this.output = function(app, compFn, validatorFn, units, selUnit, roundTo) {
			
		this.units = ko.observableArray(units);
		this.selUnit = ko.observable(this.units()[selUnit]);
		
		this.val = ko.computed(compFn, app);
		
		// Number of decimal places to round value to
		if(roundTo != null)
			this.roundTo = roundTo;
		else
			this.roundTo = 1;
		
		// This is the displayed value
		this.dispVal = ko.computed(function(){
				var unroundedVal = this.val()/this.selUnit().multiplier;
				// Round the value
				var roundedVal = Math.round(unroundedVal*Math.pow(10, this.roundTo))/Math.pow(10, this.roundTo);
				//var roundedVal = this.val();
				return roundedVal;
			},
			this);				
		
		this.lowerBound = 0; //ko.observable(lowerBound);
		this.upperBound = 0; //ko.observable(upperBound);

		// Holds all validator functions
		this.validatorA = ko.observableArray();
		
		this.trigIndex = ko.observable();
		
		// Default is to just return true.
		this.isValid = ko.computed(
			function()
			{
				Log('Computing isValid for output.');
				Log('Validator array length = ' + this.validatorA().length);
				for (var i = 0; i < this.validatorA().length; i++) {
					if(this.validatorA()[i].fn(this.validatorA()[i].app) == false)
					{
						// Remember the validator which returned false
						//this.triggeredValidator(this.validatorA()[i]);
						Log('Setting index.');
						this.trigIndex(i);
						Log('Returning false.');
						return false;
					}
				}
				// Only gets here if no validator function returned false
				Log('Returning true.');
				return true;
			},
			this
		);
				
		// Methods
		this.AddCustomValidator = function(app, msg, fn)
		{
			// Create new validator object and add to the end of the array
			this.validatorA.push(new validator(app, msg, fn));
		}
				
	};
*/